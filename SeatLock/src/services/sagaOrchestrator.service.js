import prisma from "../config/db.js";
import logger from "../config/logger.js";
import {
    createSaga,
    markSagaCompleted,
} from "./saga.service.js";
import { compensateBooking } from "./compensation.service.js";
import { createBookingOutboxEvent } from "./outbox.service.js";
import { OUTBOX_EVENT } from "../constants/outbox.constants.js";
import {
    lockShowSeat,
    updateShowSeatWithLock,
} from "../repositories/seatLock.repository.js";

/**
 * Orchestrates the Booking Saga distributed transaction.
 * 1. Verifies ownership and payment status
 * 2. Locks seats deterministically (FOR UPDATE)
 * 3. Transitions seats HELD -> BOOKED and booking PENDING -> CONFIRMED
 * 4. Dispatches compensation (refund + seat release) on any downstream failure
 */
const runBookingSaga = async ({ userId, bookingId }) => {
    const saga = await prisma.$transaction(async (tx) => {
        return createSaga(tx, { bookingId, userId });
    });

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                bookingSeats: {
                    include: { showSeat: true },
                },
                payments: true,
            },
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.userId !== userId) {
            throw new Error("User does not own this booking");
        }

        if (booking.status === "CONFIRMED") {
            await markSagaCompleted(saga.id, {
                bookingId,
                userId,
                alreadyConfirmed: true,
            });

            logger.info(
                { sagaId: saga.id, bookingId, userId },
                "Booking Saga already completed"
            );

            return {
                sagaId: saga.id,
                status: "COMPLETED",
                bookingId,
                alreadyConfirmed: true,
            };
        }

        if (booking.bookingSeats.length === 0) {
            throw new Error("Booking has no seats");
        }

        const successfulPayment = booking.payments.find(
            (payment) => payment.status === "SUCCEEDED"
        );

        if (!successfulPayment) {
            logger.info(
                { sagaId: saga.id, bookingId, userId },
                "Booking Saga waiting for successful payment"
            );

            return {
                sagaId: saga.id,
                status: "WAITING_FOR_PAYMENT",
                bookingId,
                message: "Saga is waiting for successful payment",
            };
        }

        // Sort seats to guarantee consistent lock ordering across concurrent sagas
        const sortedBookingSeats = [...booking.bookingSeats].sort((a, b) =>
            a.showSeatId.localeCompare(b.showSeatId)
        );

        await prisma.$transaction(async (tx) => {
            const lockedSeats = [];

            for (const bookingSeat of sortedBookingSeats) {
                const showSeat = await lockShowSeat(tx, bookingSeat.showSeatId);

                if (!showSeat) {
                    throw new Error(`Show seat not found: ${bookingSeat.showSeatId}`);
                }

                if (showSeat.status !== "HELD") {
                    throw new Error(`Seat ${showSeat.id} is no longer held`);
                }

                if (!showSeat.holdExpiresAt || showSeat.holdExpiresAt <= new Date()) {
                    throw new Error(`Seat ${showSeat.id} hold has expired`);
                }

                lockedSeats.push(showSeat);
            }

            const latestBooking = await tx.booking.findUnique({
                where: { id: bookingId },
            });

            if (!latestBooking) {
                throw new Error("Booking not found");
            }

            if (latestBooking.status === "CONFIRMED") {
                return;
            }

            if (latestBooking.status !== "PENDING") {
                throw new Error(
                    `Booking cannot be confirmed from status ${latestBooking.status}`
                );
            }

            // Confirm booking
            await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: "CONFIRMED",
                    confirmedAt: latestBooking.confirmedAt || new Date(),
                },
            });

            // Transition seats from HELD -> BOOKED
            for (const showSeat of lockedSeats) {
                await updateShowSeatWithLock(tx, showSeat.id, {
                    status: "BOOKED",
                    holdToken: null,
                    holdExpiresAt: null,
                    version: { increment: 1 },
                });
            }

            // Publish confirmation outbox event
            await createBookingOutboxEvent(tx, {
                eventType: OUTBOX_EVENT.BOOKING_CONFIRMED,
                bookingId: latestBooking.id,
                userId: latestBooking.userId,
                showId: latestBooking.showId,
                showSeatIds: lockedSeats.map((seat) => seat.id),
                extraPayload: { paymentId: successfulPayment.id },
            });
        });

        await markSagaCompleted(saga.id, {
            bookingId,
            userId,
            paymentId: successfulPayment.id,
        });

        logger.info(
            {
                sagaId: saga.id,
                bookingId,
                userId,
                paymentId: successfulPayment.id,
            },
            "Booking Saga completed successfully"
        );

        return {
            sagaId: saga.id,
            status: "COMPLETED",
            bookingId,
        };
    } catch (error) {
        logger.error(
            { sagaId: saga.id, bookingId, userId, error },
            "Booking Saga failed, starting compensation"
        );

        const compensation = await compensateBooking({
            sagaId: saga.id,
            bookingId,
        });

        logger.info(
            {
                sagaId: saga.id,
                bookingId,
                userId,
                compensationStatus: compensation.status,
                refundId: compensation.refundId || null,
            },
            "Booking Saga compensation completed"
        );

        return {
            sagaId: saga.id,
            status: compensation.status,
            bookingId,
            refundId: compensation.refundId,
        };
    }
};

export {
    runBookingSaga,
};
