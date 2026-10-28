import crypto from "crypto";

import prisma from "../config/db.js";

import { acquireSeatLock } from "../repositories/redlock.repository.js";
import { createOutboxEventService } from "./outbox.service.js";
import { OUTBOX_EVENT } from "../constants/outbox.constants.js";

import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const HOLD_DURATION_MINUTES = 10;
const LOCK_TTL = 10000;

const generateBookingNumber = () => {
    return `RED-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
};

const createRedlockBookingService = async (
    userId,
    { showId, showSeatIds }
) => {
    const uniqueSeatIds = [...new Set(showSeatIds)].sort();

    const locks = [];

    try {
        // Acquire Redis locks in fixed order to reduce deadlock risk
        for (const showSeatId of uniqueSeatIds) {
            const lock = await acquireSeatLock(showSeatId, LOCK_TTL);
            locks.push(lock);
        }

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

            const selectedSeats = [];

            for (const showSeatId of uniqueSeatIds) {
                const showSeat = await tx.showSeat.findUnique({
                    where: {
                        id: showSeatId,
                    },
                });

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
                    if (showSeat.holdExpiresAt && showSeat.holdExpiresAt > new Date()) {
                        throw new AppError(
                            "One or more selected seats are currently held by another user",
                            HTTP_STATUS.CONFLICT
                        );
                    }
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

            for (const seat of selectedSeats) {
                await tx.showSeat.update({
                    where: {
                        id: seat.id,
                    },
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

            await tx.bookingSeat.createMany({
                data: selectedSeats.map((seat) => ({
                    bookingId: newBooking.id,
                    showSeatId: seat.id,
                    price: seat.price,
                })),
            });

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
                holdToken,
                holdExpiresAt,
            };
        });

        return booking;
    } finally {
        // Always release Redis locks
        for (const lock of locks.reverse()) {
            try {
                await lock.release();
            } catch (error) {
                console.error("Failed to release Redis lock:", error);
            }
        }
    }
};

export {
    createRedlockBookingService,
};