import crypto from "crypto";
import prisma from "../config/db.js";
import logger from "../config/logger.js";
import { findBookingById } from "../repositories/booking.repository.js";
import {
    lockShowSeat,
    updateShowSeatWithLock,
} from "../repositories/seatLock.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { createOutboxEventService } from "./outbox.service.js";
import { OUTBOX_EVENT } from "../constants/outbox.constants.js";

const HOLD_DURATION_MINUTES = 10;

const generateBookingNumber = () => {
    const timestamp = Date.now();
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `SL-${timestamp}-${randomPart}`;
};

/**
 * Creates a new booking using PostgreSQL row-level pessimistic locks (SELECT FOR UPDATE).
 * Deterministically orders seat IDs to eliminate deadlock risk during concurrent hold contention.
 */
const createBookingService = async (
    userId,
    { showId, showSeatIds, holdToken }
) => {
    const booking = await prisma.$transaction(async (tx) => {
        const show = await tx.show.findFirst({
            where: {
                id: showId,
                isActive: true,
            },
        });

        if (!show) {
            throw new AppError(
                "Show not found or inactive",
                HTTP_STATUS.NOT_FOUND
            );
        }

        // Sort unique seat IDs to prevent cross-transaction deadlocks
        const uniqueSeatIds = [...new Set(showSeatIds)].sort();
        const lockedSeats = [];

        // Acquire pessimistic row lock on each seat
        for (const showSeatId of uniqueSeatIds) {
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

            if (showSeat.status === "HELD") {
                const isHeldByCurrentHoldToken = holdToken && showSeat.holdToken === holdToken;
                if (!isHeldByCurrentHoldToken && showSeat.holdExpiresAt && showSeat.holdExpiresAt > new Date()) {
                    throw new AppError(
                        "One or more selected seats are currently held by another user",
                        HTTP_STATUS.CONFLICT
                    );
                }
            }

            lockedSeats.push(showSeat);
        }

        const totalAmount = lockedSeats.reduce(
            (total, seat) => total + Number(seat.price),
            0
        );

        const effectiveHoldToken = holdToken || crypto.randomUUID();
        const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);

        const newBooking = await tx.booking.create({
            data: {
                userId,
                showId,
                status: "PENDING",
                totalAmount,
                bookingNumber: generateBookingNumber(),
                expiresAt: holdExpiresAt,
            },
        });

        // Transition status from AVAILABLE -> HELD
        for (const seat of lockedSeats) {
            await updateShowSeatWithLock(tx, seat.id, {
                status: "HELD",
                holdToken: effectiveHoldToken,
                holdExpiresAt,
                version: { increment: 1 },
            });
        }

        await tx.bookingSeat.createMany({
            data: lockedSeats.map((seat) => ({
                bookingId: newBooking.id,
                showSeatId: seat.id,
                price: seat.price,
            })),
        });

        // Publish Outbox events atomically inside the same transaction
        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.BOOKING_CREATED,
            aggregateType: "BOOKING",
            aggregateId: newBooking.id,
            payload: {
                bookingId: newBooking.id,
                userId,
                showId,
                showSeatIds: uniqueSeatIds,
            },
        });

        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.SEATS_HELD,
            aggregateType: "BOOKING",
            aggregateId: newBooking.id,
            payload: {
                bookingId: newBooking.id,
                userId,
                showId,
                showSeatIds: uniqueSeatIds,
                holdExpiresAt,
            },
        });

        await createOutboxEventService(tx, {
            eventType: OUTBOX_EVENT.SEAT_RELEASE_SCHEDULED,
            aggregateType: "BOOKING",
            aggregateId: newBooking.id,
            payload: {
                bookingId: newBooking.id,
                userId,
                showId,
                showSeatIds: uniqueSeatIds,
                holdExpiresAt,
            },
        });

        return {
            ...newBooking,
            holdToken: effectiveHoldToken,
            holdExpiresAt,
        };
    });

    logger.info(
        {
            userId,
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            showId,
            showSeatIds,
            totalAmount: Number(booking.totalAmount),
            holdExpiresAt: booking.holdExpiresAt,
        },
        "Booking created and seats held"
    );

    return booking;
};

const getBookingByIdService = async (bookingId, userId) => {
    const booking = await findBookingById(bookingId);

    if (!booking) {
        throw new AppError("Booking not found", HTTP_STATUS.NOT_FOUND);
    }

    if (booking.userId !== userId) {
        throw new AppError("You are not allowed to access this booking", HTTP_STATUS.FORBIDDEN);
    }

    return booking;
};

const getMyBookingsService = async (userId) => {
    return prisma.booking.findMany({
        where: { userId },
        include: {
            show: {
                include: {
                    movie: true,
                    screen: {
                        include: { theater: true },
                    },
                },
            },
            bookingSeats: {
                include: {
                    showSeat: {
                        include: { seat: true },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

export {
    createBookingService,
    getBookingByIdService,
    getMyBookingsService,
};
