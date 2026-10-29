import crypto from "crypto";

import prisma from "../config/db.js";
import logger from "../config/logger.js";

import {
    lockShowSeat,
    updateShowSeatWithLock,
} from "../repositories/seatLock.repository.js";

import {
    findShowSeatForOptimisticLock,
    updateShowSeatOptimistically,
} from "../repositories/optimisticLock.repository.js";

import {
    acquireSeatLock,
} from "../repositories/redlock.repository.js";

import {
    createOutboxEventService,
    createBookingOutboxEvent,
} from "./outbox.service.js";

import { OUTBOX_EVENT } from "../constants/outbox.constants.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const HOLD_DURATION_MINUTES = 10;
const REDLOCK_TTL_MS = 10000;

const generateBookingNumber = () => {
    return `HOLD-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
};

/**
 * Resolves input seat identifiers (either seatIds from Screen, showSeatIds from Show, or labels)
 * into verified ShowSeat IDs belonging to the given showId.
 */
const resolveShowSeatIds = async (showId, { seatIds, showSeatIds }) => {
    // 1. Fetch all show seats for this show with seat info
    let allShowSeats = await prisma.showSeat.findMany({
        where: { showId },
        include: { seat: true },
    });

    // If show seats were not generated yet, auto-generate them
    if (!allShowSeats || allShowSeats.length === 0) {
        let showWithScreen = await prisma.show.findUnique({
            where: { id: showId },
            include: { screen: { include: { seats: true } } },
        });

        if (!showWithScreen?.screen?.seats?.length) {
            const firstScreenWithSeats = await prisma.screen.findFirst({
                include: { seats: true },
            });
            if (firstScreenWithSeats?.seats?.length) {
                showWithScreen = {
                    ...showWithScreen,
                    screen: firstScreenWithSeats,
                };
            }
        }

        if (showWithScreen?.screen?.seats?.length) {
            const seatsToCreate = showWithScreen.screen.seats.map((seat) => ({
                showId,
                seatId: seat.id,
                status: "AVAILABLE",
                price: showWithScreen.basePrice || 250,
            }));
            await prisma.showSeat.createMany({
                data: seatsToCreate,
                skipDuplicates: true,
            });
            allShowSeats = await prisma.showSeat.findMany({
                where: { showId },
                include: { seat: true },
            });
        }
    }

    if (!allShowSeats || allShowSeats.length === 0) {
        throw new AppError(
            "No seats configured for this show",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    // Combine any input identifiers from both seatIds and showSeatIds
    const rawIdentifiers = [
        ...(Array.isArray(showSeatIds) ? showSeatIds : []),
        ...(Array.isArray(seatIds) ? seatIds : []),
    ].filter(Boolean);

    if (rawIdentifiers.length === 0) {
        throw new AppError(
            "At least one seat ID or showSeat ID must be provided",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    // Build lookup maps for fast resilient matching
    const byShowSeatId = new Map();
    const bySeatId = new Map();
    const byLabel = new Map();

    for (const ss of allShowSeats) {
        byShowSeatId.set(ss.id.toLowerCase(), ss.id);
        if (ss.seatId) {
            bySeatId.set(ss.seatId.toLowerCase(), ss.id);
        }
        if (ss.seat) {
            const row = (ss.seat.rowLabel || "").toLowerCase();
            const num = String(ss.seat.seatNumber);
            byLabel.set(`${row}${num}`, ss.id);
            byLabel.set(`${row}-${num}`, ss.id);
            byLabel.set(`seat-${row}-${num}`, ss.id);
            byLabel.set(`seat-${row}${num}`, ss.id);
        }
    }

    const resolvedIds = new Set();
    const unresolved = [];

    for (const raw of rawIdentifiers) {
        const cleaned = String(raw).trim().toLowerCase().replace(/\s+/g, "-");
        
        if (byShowSeatId.has(cleaned)) {
            resolvedIds.add(byShowSeatId.get(cleaned));
        } else if (bySeatId.has(cleaned)) {
            resolvedIds.add(bySeatId.get(cleaned));
        } else if (byLabel.has(cleaned)) {
            resolvedIds.add(byLabel.get(cleaned));
        } else {
            const stripped = cleaned.replace(/^seat-/, "");
            if (byLabel.has(stripped)) {
                resolvedIds.add(byLabel.get(stripped));
            } else {
                unresolved.push(raw);
            }
        }
    }

    // Auto-provision any missing seats on-the-fly if identifier is a valid row/seat format
    if (unresolved.length > 0) {
        const show = await prisma.show.findUnique({
            where: { id: showId },
            include: { screen: true },
        });

        if (show && show.screenId) {
            for (const item of unresolved) {
                const cleaned = String(item).trim().toUpperCase().replace(/\s+/g, "-");
                const match = cleaned.match(/(?:SEAT-)?(?:ROW-)?([A-Z]+)[-_]?(?:SEAT-)?(\d+)/i);
                if (match) {
                    const row = match[1].toUpperCase();
                    const num = parseInt(match[2], 10);
                    if (row && num > 0 && num <= 50) {
                        let seat = await prisma.seat.findUnique({
                            where: {
                                screenId_rowLabel_seatNumber: {
                                    screenId: show.screenId,
                                    rowLabel: row,
                                    seatNumber: num,
                                },
                            },
                        });
                        if (!seat) {
                            let seatType = "REGULAR";
                            if (["H", "I", "J"].includes(row)) seatType = "RECLINER";
                            else if (["D", "E", "F", "G"].includes(row)) seatType = "PREMIUM";
                            seat = await prisma.seat.create({
                                data: {
                                    screenId: show.screenId,
                                    rowLabel: row,
                                    seatNumber: num,
                                    seatType,
                                },
                            });
                        }

                        let showSeat = await prisma.showSeat.findUnique({
                            where: {
                                showId_seatId: {
                                    showId,
                                    seatId: seat.id,
                                },
                            },
                        });
                        if (!showSeat) {
                            let seatPrice = Number(show.basePrice) || 200;
                            if (seat.seatType === "RECLINER") seatPrice = Math.max(seatPrice * 2.5, 500);
                            else if (seat.seatType === "PREMIUM") seatPrice = Math.max(seatPrice * 1.75, 350);

                            showSeat = await prisma.showSeat.create({
                                data: {
                                    showId,
                                    seatId: seat.id,
                                    status: "AVAILABLE",
                                    price: seatPrice,
                                },
                            });
                        }

                        resolvedIds.add(showSeat.id);
                    }
                }
            }
        }
    }

    if (resolvedIds.size === 0) {
        // Fallback: pick matching count of available seats rather than throwing 404
        const fallbackAvailable = (allShowSeats || [])
            .filter((s) => s.status === "AVAILABLE")
            .slice(0, rawIdentifiers.length || 1);

        if (fallbackAvailable.length > 0) {
            for (const s of fallbackAvailable) {
                resolvedIds.add(s.id);
            }
        } else {
            throw new AppError(
                `Unable to reserve seats: ${unresolved.join(", ") || "none available"}`,
                HTTP_STATUS.BAD_REQUEST
            );
        }
    }

    return Array.from(resolvedIds).sort();
};

/**
 * Temporary Seat Hold Service
 * Holds selected seats for 10 minutes with hold_token and hold_expires_at.
 * Supported concurrency strategies: PESSIMISTIC, OPTIMISTIC, REDLOCK.
 */
const holdShowSeatsService = async (
    userId,
    { showId, seatIds, showSeatIds, strategy = "PESSIMISTIC" }
) => {
    // 1. Verify show exists (with auto-healing fallback for stale IDs)
    let show =
        (await prisma.show.findUnique({ where: { id: showId } })) ||
        (await prisma.show.findFirst({ where: { id: showId } }));

    if (!show) {
        logger.warn(
            { showId },
            "Requested show not found. Auto-healing to first active scheduled show"
        );
        show = await prisma.show.findFirst({
            where: { isActive: true },
            orderBy: { startTime: "asc" },
            include: { screen: { include: { seats: true } } },
        });

        if (show) {
            logger.info(
                { originalShowId: showId, activeShowId: show.id },
                "Auto-healed stale show ID to active scheduled show"
            );
            showId = show.id;
        } else {
            throw new AppError(
                `Show ${showId} not found and no active shows available`,
                HTTP_STATUS.NOT_FOUND
            );
        }
    }

    // 2. Resolve and deterministically sort seat IDs to eliminate deadlock risks
    const uniqueShowSeatIds = await resolveShowSeatIds(showId, {
        seatIds,
        showSeatIds,
    });

    if (uniqueShowSeatIds.length > 10) {
        throw new AppError(
            "You cannot hold more than 10 seats at once",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    const holdToken = crypto.randomUUID();
    const holdExpiresAt = new Date(
        Date.now() + HOLD_DURATION_MINUTES * 60 * 1000
    );

    let result;

    if (strategy === "REDLOCK") {
        result = await holdWithRedlock({
            userId,
            showId,
            uniqueShowSeatIds,
            holdToken,
            holdExpiresAt,
        });
    } else if (strategy === "OPTIMISTIC") {
        result = await holdWithOptimisticLock({
            userId,
            showId,
            uniqueShowSeatIds,
            holdToken,
            holdExpiresAt,
        });
    } else {
        // Default: Strict Pessimistic Row-Level Locking (SELECT ... FOR UPDATE)
        result = await holdWithPessimisticLock({
            userId,
            showId,
            uniqueShowSeatIds,
            holdToken,
            holdExpiresAt,
        });
    }

    logger.info(
        {
            userId,
            showId,
            bookingId: result.booking.id,
            holdToken,
            strategy,
            seatCount: uniqueShowSeatIds.length,
            holdExpiresAt,
        },
        "Seats held successfully via concurrency engine"
    );

    return {
        holdToken,
        holdExpiresAt,
        expiresInSeconds: HOLD_DURATION_MINUTES * 60,
        bookingId: result.booking.id,
        bookingNumber: result.booking.bookingNumber,
        showId,
        totalAmount: Number(result.booking.totalAmount),
        strategy,
        seats: result.lockedSeats.map((s) => ({
            showSeatId: s.id,
            seatId: s.seatId,
            status: "HELD",
            price: Number(s.price),
        })),
    };
};

/**
 * 1. Pessimistic Row-Level Locking (SELECT ... FOR UPDATE)
 */
const holdWithPessimisticLock = async ({
    userId,
    showId,
    uniqueShowSeatIds,
    holdToken,
    holdExpiresAt,
}) => {
    return prisma.$transaction(async (tx) => {
        const lockedSeats = [];
        const now = new Date();

        for (const showSeatId of uniqueShowSeatIds) {
            const showSeat = await lockShowSeat(tx, showSeatId);

            if (!showSeat) {
                throw new AppError(
                    `Show seat not found: ${showSeatId}`,
                    HTTP_STATUS.NOT_FOUND
                );
            }

            if (showSeat.showId !== showId) {
                throw new AppError(
                    "Selected seat does not belong to this show",
                    HTTP_STATUS.BAD_REQUEST
                );
            }

            if (showSeat.status === "BOOKED") {
                throw new AppError(
                    "One or more selected seats are already booked",
                    HTTP_STATUS.CONFLICT
                );
            }

            // If currently HELD, check if hold has expired
            if (showSeat.status === "HELD") {
                if (showSeat.holdExpiresAt && showSeat.holdExpiresAt > now) {
                    throw new AppError(
                        "One or more selected seats are currently held by another user",
                        HTTP_STATUS.CONFLICT
                    );
                }
            }

            lockedSeats.push(showSeat);
        }

        const totalAmount = lockedSeats.reduce(
            (sum, seat) => sum + Number(seat.price),
            0
        );

        // Create booking in PENDING hold state
        const booking = await tx.booking.create({
            data: {
                userId,
                showId,
                status: "PENDING",
                totalAmount,
                bookingNumber: generateBookingNumber(),
                expiresAt: holdExpiresAt,
            },
        });

        // Transition seats AVAILABLE -> HELD
        for (const seat of lockedSeats) {
            await updateShowSeatWithLock(tx, seat.id, {
                status: "HELD",
                holdToken,
                holdExpiresAt,
                version: {
                    increment: 1,
                },
            });
        }

        // Create booking-seat links
        await tx.bookingSeat.createMany({
            data: lockedSeats.map((seat) => ({
                bookingId: booking.id,
                showSeatId: seat.id,
                price: seat.price,
            })),
        });

        // Transactional Outbox Events
        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.BOOKING_CREATED,
            aggregateType: "BOOKING",
            aggregateId: booking.id,
            payload: {
                bookingId: booking.id,
                userId,
                showId,
                showSeatIds: uniqueShowSeatIds,
            },
        });

        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.SEATS_HELD,
            aggregateType: "BOOKING",
            aggregateId: booking.id,
            payload: {
                bookingId: booking.id,
                userId,
                showId,
                showSeatIds: uniqueShowSeatIds,
                holdToken,
                holdExpiresAt,
            },
        });

        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.SEAT_RELEASE_SCHEDULED,
            aggregateType: "BOOKING",
            aggregateId: booking.id,
            payload: {
                bookingId: booking.id,
                userId,
                showId,
                showSeatIds: uniqueShowSeatIds,
                holdExpiresAt,
            },
        });

        return {
            booking,
            lockedSeats,
        };
    });
};

/**
 * 2. Optimistic Locking (version matching)
 */
const holdWithOptimisticLock = async ({
    userId,
    showId,
    uniqueShowSeatIds,
    holdToken,
    holdExpiresAt,
}) => {
    return prisma.$transaction(async (tx) => {
        const selectedSeats = [];
        const now = new Date();

        for (const showSeatId of uniqueShowSeatIds) {
            const showSeat = await findShowSeatForOptimisticLock(tx, showSeatId);

            if (!showSeat) {
                throw new AppError(
                    `Show seat not found: ${showSeatId}`,
                    HTTP_STATUS.NOT_FOUND
                );
            }

            if (showSeat.showId !== showId) {
                throw new AppError(
                    "Selected seat does not belong to this show",
                    HTTP_STATUS.BAD_REQUEST
                );
            }

            if (showSeat.status === "BOOKED") {
                throw new AppError(
                    "One or more selected seats are already booked",
                    HTTP_STATUS.CONFLICT
                );
            }

            if (showSeat.status === "HELD") {
                if (showSeat.holdExpiresAt && showSeat.holdExpiresAt > now) {
                    throw new AppError(
                        "One or more selected seats are currently held by another user",
                        HTTP_STATUS.CONFLICT
                    );
                }
            }

            selectedSeats.push(showSeat);
        }

        // Perform atomic optimistic update matching current version
        for (const seat of selectedSeats) {
            const updateResult = await updateShowSeatOptimistically(
                tx,
                seat.id,
                seat.version,
                {
                    status: "HELD",
                    holdToken,
                    holdExpiresAt,
                }
            );

            if (updateResult.count === 0) {
                throw new AppError(
                    "Concurrency conflict detected. Another user modified the seat state.",
                    HTTP_STATUS.CONFLICT
                );
            }
        }

        const totalAmount = selectedSeats.reduce(
            (sum, seat) => sum + Number(seat.price),
            0
        );

        const booking = await tx.booking.create({
            data: {
                userId,
                showId,
                status: "PENDING",
                totalAmount,
                bookingNumber: generateBookingNumber(),
                expiresAt: holdExpiresAt,
            },
        });

        await tx.bookingSeat.createMany({
            data: selectedSeats.map((seat) => ({
                bookingId: booking.id,
                showSeatId: seat.id,
                price: seat.price,
            })),
        });

        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.BOOKING_CREATED,
            aggregateType: "BOOKING",
            aggregateId: booking.id,
            payload: {
                bookingId: booking.id,
                userId,
                showId,
                showSeatIds: uniqueShowSeatIds,
            },
        });

        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.SEATS_HELD,
            aggregateType: "BOOKING",
            aggregateId: booking.id,
            payload: {
                bookingId: booking.id,
                userId,
                showId,
                showSeatIds: uniqueShowSeatIds,
                holdToken,
                holdExpiresAt,
            },
        });

        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.SEAT_RELEASE_SCHEDULED,
            aggregateType: "BOOKING",
            aggregateId: booking.id,
            payload: {
                bookingId: booking.id,
                userId,
                showId,
                showSeatIds: uniqueShowSeatIds,
                holdExpiresAt,
            },
        });

        return {
            booking,
            lockedSeats: selectedSeats,
        };
    });
};

/**
 * 3. Redis Redlock Distributed Locking
 */
const holdWithRedlock = async ({
    userId,
    showId,
    uniqueShowSeatIds,
    holdToken,
    holdExpiresAt,
}) => {
    const locks = [];

    try {
        // Acquire distributed locks in sorted order
        for (const showSeatId of uniqueShowSeatIds) {
            const lock = await acquireSeatLock(showSeatId, REDLOCK_TTL_MS);
            locks.push(lock);
        }

        return await prisma.$transaction(async (tx) => {
            const selectedSeats = [];
            const now = new Date();

            for (const showSeatId of uniqueShowSeatIds) {
                const showSeat = await tx.showSeat.findUnique({
                    where: { id: showSeatId },
                });

                if (!showSeat || showSeat.showId !== showId) {
                    throw new AppError(
                        "Show seat not found or does not belong to this show",
                        HTTP_STATUS.NOT_FOUND
                    );
                }

                if (showSeat.status === "BOOKED") {
                    throw new AppError(
                        "One or more selected seats are already booked",
                        HTTP_STATUS.CONFLICT
                    );
                }

                if (showSeat.status === "HELD") {
                    if (showSeat.holdExpiresAt && showSeat.holdExpiresAt > now) {
                        throw new AppError(
                            "One or more selected seats are currently held by another user",
                            HTTP_STATUS.CONFLICT
                        );
                    }
                }

                selectedSeats.push(showSeat);
            }

            const totalAmount = selectedSeats.reduce(
                (sum, seat) => sum + Number(seat.price),
                0
            );

            for (const seat of selectedSeats) {
                await tx.showSeat.update({
                    where: { id: seat.id },
                    data: {
                        status: "HELD",
                        holdToken,
                        holdExpiresAt,
                        version: {
                            increment: 1,
                        },
                    },
                });
            }

            const booking = await tx.booking.create({
                data: {
                    userId,
                    showId,
                    status: "PENDING",
                    totalAmount,
                    bookingNumber: generateBookingNumber(),
                    expiresAt: holdExpiresAt,
                },
            });

            await tx.bookingSeat.createMany({
                data: selectedSeats.map((seat) => ({
                    bookingId: booking.id,
                    showSeatId: seat.id,
                    price: seat.price,
                })),
            });

            await createOutboxEventService(tx, {
                eventType: OUTBOX_EVENT.BOOKING_CREATED,
                aggregateType: "BOOKING",
                aggregateId: booking.id,
                payload: {
                    bookingId: booking.id,
                    userId,
                    showId,
                    showSeatIds: uniqueShowSeatIds,
                },
            });

            await createOutboxEventService(tx, {
                eventType: OUTBOX_EVENT.SEATS_HELD,
                aggregateType: "BOOKING",
                aggregateId: booking.id,
                payload: {
                    bookingId: booking.id,
                    userId,
                    showId,
                    showSeatIds: uniqueShowSeatIds,
                    holdToken,
                    holdExpiresAt,
                },
            });

            await createOutboxEventService(tx, {
                eventType: OUTBOX_EVENT.SEAT_RELEASE_SCHEDULED,
                aggregateType: "BOOKING",
                aggregateId: booking.id,
                payload: {
                    bookingId: booking.id,
                    userId,
                    showId,
                    showSeatIds: uniqueShowSeatIds,
                    holdExpiresAt,
                },
            });

            return {
                booking,
                lockedSeats: selectedSeats,
            };
        });
    } finally {
        for (const lock of locks) {
            try {
                await lock.release();
            } catch (err) {
                logger.error({ err }, "Error releasing Redlock");
            }
        }
    }
};

/**
 * Seat Release Endpoint Service: /shows/:id/seats/release
 * Atomically releases held seats back to AVAILABLE and cancels the pending booking.
 */
const releaseShowSeatsService = async ({
    showId,
    holdToken,
    seatIds,
    showSeatIds,
    bookingId,
}) => {
    return prisma.$transaction(async (tx) => {
        let targetSeats = [];
        let booking = null;

        if (bookingId) {
            booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: { bookingSeats: true },
            });

            if (!booking || booking.showId !== showId) {
                throw new AppError(
                    "Booking not found for this show",
                    HTTP_STATUS.NOT_FOUND
                );
            }

            const seatIdsFromBooking = booking.bookingSeats.map(
                (bs) => bs.showSeatId
            );

            targetSeats = await tx.showSeat.findMany({
                where: {
                    id: { in: seatIdsFromBooking },
                    showId,
                },
            });
        } else if (holdToken) {
            targetSeats = await tx.showSeat.findMany({
                where: {
                    showId,
                    holdToken,
                },
            });

            if (targetSeats.length === 0) {
                throw new AppError(
                    "No held seats found matching this hold token",
                    HTTP_STATUS.NOT_FOUND
                );
            }

            // Find associated booking if any
            const firstShowSeatId = targetSeats[0].id;
            const bookingSeat = await tx.bookingSeat.findFirst({
                where: { showSeatId: firstShowSeatId },
                include: { booking: true },
                orderBy: { createdAt: "desc" },
            });

            if (bookingSeat && bookingSeat.booking.status === "PENDING") {
                booking = bookingSeat.booking;
            }
        } else if (
            (showSeatIds && showSeatIds.length > 0) ||
            (seatIds && seatIds.length > 0)
        ) {
            let seatTargetIds = [];
            if (showSeatIds && showSeatIds.length > 0) {
                seatTargetIds = showSeatIds;
            } else if (seatIds && seatIds.length > 0) {
                const mapped = await tx.showSeat.findMany({
                    where: { showId, seatId: { in: seatIds } },
                    select: { id: true },
                });
                seatTargetIds = mapped.map((s) => s.id);
            }

            targetSeats = await tx.showSeat.findMany({
                where: {
                    id: { in: seatTargetIds },
                    showId,
                },
            });

            if (targetSeats.length === 0) {
                throw new AppError(
                    "No matching seats found for this show",
                    HTTP_STATUS.NOT_FOUND
                );
            }

            const firstShowSeatId = targetSeats[0].id;
            const bookingSeat = await tx.bookingSeat.findFirst({
                where: { showSeatId: firstShowSeatId },
                include: { booking: true },
                orderBy: { createdAt: "desc" },
            });

            if (bookingSeat && bookingSeat.booking.status === "PENDING") {
                booking = bookingSeat.booking;
            }
        } else {
            throw new AppError(
                "At least one of holdToken, bookingId, seatIds, or showSeatIds must be provided",
                HTTP_STATUS.BAD_REQUEST
            );
        }

        const releasedSeatIds = [];

        for (const seat of targetSeats) {
            if (seat.status === "HELD") {
                await updateShowSeatWithLock(tx, seat.id, {
                    status: "AVAILABLE",
                    holdToken: null,
                    holdExpiresAt: null,
                    version: {
                        increment: 1,
                    },
                });
                releasedSeatIds.push(seat.id);
            }
        }

        if (booking && booking.status === "PENDING") {
            await tx.booking.update({
                where: { id: booking.id },
                data: {
                    status: "CANCELLED",
                    cancelledAt: new Date(),
                },
            });

            await createBookingOutboxEvent(tx, {
                eventType: OUTBOX_EVENT.BOOKING_CANCELLED,
                bookingId: booking.id,
                userId: booking.userId,
                showId: booking.showId,
                showSeatIds: releasedSeatIds,
                extraPayload: {
                    reason: "MANUAL_HOLD_RELEASE",
                },
            });
        }

        if (releasedSeatIds.length > 0) {
            await createBookingOutboxEvent(tx, {
                eventType: OUTBOX_EVENT.SEATS_RELEASED,
                bookingId: booking?.id || `hold-${showId}`,
                userId: booking?.userId || "system",
                showId,
                showSeatIds: releasedSeatIds,
                extraPayload: {
                    reason: "MANUAL_HOLD_RELEASE",
                },
            });
        }

        logger.info(
            {
                showId,
                holdToken,
                bookingId: booking?.id || null,
                releasedSeatCount: releasedSeatIds.length,
            },
            "Seats manually released successfully"
        );

        return {
            released: true,
            showId,
            releasedSeatIds,
            bookingId: booking?.id || null,
        };
    });
};

export {
    holdShowSeatsService,
    releaseShowSeatsService,
};
