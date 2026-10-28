import prisma from "../config/db.js";
import logger from "../config/logger.js";
import { OUTBOX_EVENT } from "../constants/outbox.constants.js";
import { createBookingOutboxEvent } from "./outbox.service.js";

/**
 * Scans show_seats for expired holds (hold_expires_at < NOW() where status = 'HELD'),
 * reverts status to 'AVAILABLE', and emits SEAT_RELEASED events.
 */
const scanAndExpireHoldsService = async (batchSize = 200) => {
    const now = new Date();

    const expiredShowSeats = await prisma.showSeat.findMany({
        where: {
            status: "HELD",
            holdExpiresAt: {
                lt: now,
            },
        },
        select: {
            id: true,
            showId: true,
            holdToken: true,
        },
        take: batchSize,
    });

    if (expiredShowSeats.length === 0) {
        return {
            expiredSeatsCount: 0,
            cancelledBookingsCount: 0,
        };
    }

    const showSeatIds = expiredShowSeats.map((s) => s.id);

    const result = await prisma.$transaction(
        async (tx) => {
            await tx.showSeat.updateMany({
                where: {
                    id: { in: showSeatIds },
                    status: "HELD",
                    holdExpiresAt: { lt: now },
                },
                data: {
                    status: "AVAILABLE",
                    holdToken: null,
                    holdExpiresAt: null,
                    version: {
                        increment: 1,
                    },
                },
            });

            const bookingSeats = await tx.bookingSeat.findMany({
                where: {
                    showSeatId: { in: showSeatIds },
                },
                include: {
                    booking: true,
                },
            });

            const pendingBookingsToCancel = new Map();
            for (const bs of bookingSeats) {
                if (bs.booking && bs.booking.status === "PENDING") {
                    if (!pendingBookingsToCancel.has(bs.booking.id)) {
                        pendingBookingsToCancel.set(bs.booking.id, {
                            booking: bs.booking,
                            seatIds: [],
                        });
                    }
                    pendingBookingsToCancel.get(bs.booking.id).seatIds.push(bs.showSeatId);
                }
            }

            const cancelledBookingIds = [];

            for (const [bookingId, { booking, seatIds }] of pendingBookingsToCancel) {
                await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: "CANCELLED",
                        cancelledAt: new Date(),
                    },
                });
                cancelledBookingIds.push(bookingId);

                await createBookingOutboxEvent(tx, {
                    eventType: OUTBOX_EVENT.BOOKING_CANCELLED,
                    bookingId: booking.id,
                    userId: booking.userId,
                    showId: booking.showId,
                    showSeatIds: seatIds,
                    extraPayload: {
                        reason: "HOLD_EXPIRED_CRON",
                    },
                });

                await createBookingOutboxEvent(tx, {
                    eventType: OUTBOX_EVENT.SEATS_RELEASED,
                    bookingId: booking.id,
                    userId: booking.userId,
                    showId: booking.showId,
                    showSeatIds: seatIds,
                    extraPayload: {
                        reason: "HOLD_EXPIRED_CRON",
                    },
                });
            }

            return {
                expiredSeatsCount: showSeatIds.length,
                cancelledBookingsCount: cancelledBookingIds.length,
            };
        },
        {
            maxWait: 10000,
            timeout: 15000,
        }
    );

    logger.info(
        {
            expiredSeatsCount: result.expiredSeatsCount,
            cancelledBookingsCount: result.cancelledBookingsCount,
        },
        "[Hold Expire Service] Expired seat holds reverted successfully"
    );

    return result;
};

export {
    scanAndExpireHoldsService,
};

