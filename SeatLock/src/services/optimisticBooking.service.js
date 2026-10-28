import crypto from "crypto";
import prisma from "../config/db.js";
import {
    findShowSeatForOptimisticLock,
    updateShowSeatOptimistically,
} from "../repositories/optimisticLock.repository.js";
import { createOutboxEventService } from "./outbox.service.js";
import { OUTBOX_EVENT } from "../constants/outbox.constants.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const HOLD_DURATION_MINUTES = 10;
const MAX_OPTIMISTIC_RETRIES = 3;

const generateBookingNumber = () => {
    const timestamp = Date.now();
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `OPT-${timestamp}-${randomPart}`;
};

class OptimisticConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = "OptimisticConflictError";
    }
}

/**
 * Optimistic booking transaction using version-based CAS updates.
 */
const createOptimisticBookingTransaction = async (
    userId,
    { showId, showSeatIds }
) => {
    return prisma.$transaction(async (tx) => {
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

        const uniqueSeatIds = [...new Set(showSeatIds)];
        const selectedSeats = [];

        for (const showSeatId of uniqueSeatIds) {
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

            if (
                showSeat.status === "HELD" &&
                showSeat.holdExpiresAt &&
                showSeat.holdExpiresAt > new Date()
            ) {
                throw new AppError(
                    "One or more selected seats are currently held by another user",
                    HTTP_STATUS.CONFLICT
                );
            }

            selectedSeats.push(showSeat);
        }

        const totalAmount = selectedSeats.reduce(
            (total, seat) => total + Number(seat.price),
            0
        );

        const holdToken = crypto.randomUUID();
        const holdExpiresAt = new Date(
            Date.now() + HOLD_DURATION_MINUTES * 60 * 1000
        );

        // Optimistic CAS update: WHERE id = seat.id AND version = seat.version
        for (const seat of selectedSeats) {
            const result = await updateShowSeatOptimistically(
                tx,
                seat.id,
                seat.version,
                {
                    status: "HELD",
                    holdToken,
                    holdExpiresAt,
                }
            );

            if (result.count === 0) {
                throw new OptimisticConflictError(
                    "Seat version changed during booking"
                );
            }
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
                showSeatIds: uniqueSeatIds,
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
                showSeatIds: uniqueSeatIds,
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
                showSeatIds: uniqueSeatIds,
                holdExpiresAt,
            },
        });

        return {
            ...booking,
            holdToken,
            holdExpiresAt,
        };
    }, {
        maxWait: 10000,
        timeout: 15000,
    });
};

/**
 * Public optimistic booking service with automatic retry & exponential jitter on CAS conflicts.
 */
const createOptimisticBookingService = async (userId, bookingData) => {
    for (let attempt = 1; attempt <= MAX_OPTIMISTIC_RETRIES; attempt++) {
        try {
            return await createOptimisticBookingTransaction(userId, bookingData);
        } catch (error) {
            // Only retry genuine optimistic CAS version conflicts
            if (
                error instanceof OptimisticConflictError ||
                error.code === "P2034" ||
                error.code === "P2028"
            ) {
                if (attempt === MAX_OPTIMISTIC_RETRIES) {
                    throw new AppError(
                        "Seat was updated by another user. Please select another seat.",
                        HTTP_STATUS.CONFLICT
                    );
                }

                // Add random jitter between 20ms and 50ms to minimize collision
                const delay = 20 + Math.floor(Math.random() * 30);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }

            throw error;
        }
    }

    throw new AppError("Unable to create booking", HTTP_STATUS.CONFLICT);
};

export {
    createOptimisticBookingService,
};
