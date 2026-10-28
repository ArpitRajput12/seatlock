import prisma from "../config/db.js";

import {
    lockShowSeat,
    updateShowSeatWithLock,
} from "../repositories/seatLock.repository.js";

import {
    createBookingOutboxEvent,
} from "./outbox.service.js";

import {
    OUTBOX_EVENT,
} from "../constants/outbox.constants.js";


const releaseExpiredBookingSeats = async (
    bookingId
) => {

    return prisma.$transaction(
        async (tx) => {

            // --------------------------------------------------
            // 1. Find booking
            // --------------------------------------------------

            const booking =
                await tx.booking.findUnique({

                    where: {
                        id: bookingId,
                    },

                    include: {
                        bookingSeats: true,
                    },

                });


            if (!booking) {

                return {
                    released: false,
                    reason: "BOOKING_NOT_FOUND",
                };
            }


            // --------------------------------------------------
            // 2. Booking must still be PENDING
            // --------------------------------------------------

            if (
                booking.status !== "PENDING"
            ) {

                return {
                    released: false,
                    reason: "BOOKING_NOT_PENDING",
                };
            }


            // --------------------------------------------------
            // 3. Check expiry
            // --------------------------------------------------

            const now = new Date();


            if (
                !booking.expiresAt ||
                booking.expiresAt > now
            ) {

                return {
                    released: false,
                    reason: "BOOKING_NOT_EXPIRED",
                };
            }


            // --------------------------------------------------
            // 4. Sort ShowSeat IDs
            //
            // Important:
            // Same locking order reduces deadlock risk.
            // --------------------------------------------------

            const sortedBookingSeats = [
                ...booking.bookingSeats,
            ].sort(
                (a, b) =>
                    a.showSeatId.localeCompare(
                        b.showSeatId
                    )
            );


            // --------------------------------------------------
            // 5. Lock every ShowSeat
            // --------------------------------------------------

            const lockedSeats = [];


            for (
                const bookingSeat
                of sortedBookingSeats
            ) {

                const showSeat =
                    await lockShowSeat(
                        tx,
                        bookingSeat.showSeatId
                    );


                if (!showSeat) {

                    continue;
                }


                lockedSeats.push(
                    showSeat
                );
            }


            // --------------------------------------------------
            // 6. Re-check booking
            //
            // After waiting for seat locks, the booking may
            // have been confirmed by the payment/Saga flow.
            // --------------------------------------------------

            const latestBooking =
                await tx.booking.findUnique({

                    where: {
                        id: bookingId,
                    },

                });


            if (!latestBooking) {

                return {
                    released: false,
                    reason: "BOOKING_NOT_FOUND",
                };
            }


            if (
                latestBooking.status !==
                "PENDING"
            ) {

                return {
                    released: false,
                    reason: "BOOKING_ALREADY_PROCESSED",
                };
            }


            if (
                !latestBooking.expiresAt ||
                latestBooking.expiresAt > new Date()
            ) {

                return {
                    released: false,
                    reason: "BOOKING_NOT_EXPIRED",
                };
            }


            // --------------------------------------------------
            // 7. Release only HELD seats
            // --------------------------------------------------

            const releasedSeatIds = [];


            for (
                const showSeat
                of lockedSeats
            ) {

                if (
                    showSeat.status !==
                    "HELD"
                ) {

                    continue;
                }


                // --------------------------------------------------
                // Important:
                // Verify hold hasn't changed.
                // --------------------------------------------------

                if (
                    !showSeat.holdExpiresAt ||
                    showSeat.holdExpiresAt > new Date()
                ) {

                    continue;
                }


                await updateShowSeatWithLock(

                    tx,

                    showSeat.id,

                    {
                        status: "AVAILABLE",

                        holdToken: null,

                        holdExpiresAt: null,

                        version: {
                            increment: 1,
                        },
                    }

                );


                releasedSeatIds.push(
                    showSeat.id
                );
            }


            // --------------------------------------------------
            // 8. If no seats were released,
            // don't unnecessarily cancel booking.
            // --------------------------------------------------

            if (
                releasedSeatIds.length === 0
            ) {

                return {
                    released: false,
                    reason: "NO_HELD_SEATS_TO_RELEASE",
                };
            }


            // --------------------------------------------------
            // 9. Cancel expired booking
            // --------------------------------------------------

            await tx.booking.update({

                where: {
                    id: bookingId,
                },

                data: {

                    status: "CANCELLED",

                    cancelledAt: new Date(),

                },

            });


            // --------------------------------------------------
            // 10. BOOKING_CANCELLED Outbox Event
            // --------------------------------------------------

            await createBookingOutboxEvent(

                tx,

                {
                    eventType:
                        OUTBOX_EVENT.BOOKING_CANCELLED,

                    bookingId:
                        latestBooking.id,

                    userId:
                        latestBooking.userId,

                    showId:
                        latestBooking.showId,

                    showSeatIds:
                        releasedSeatIds,

                    extraPayload: {
                        reason:
                            "HOLD_EXPIRED",
                    },
                }

            );


            // --------------------------------------------------
            // 11. SEATS_RELEASED Outbox Event
            // --------------------------------------------------

            await createBookingOutboxEvent(

                tx,

                {
                    eventType:
                        OUTBOX_EVENT.SEATS_RELEASED,

                    bookingId:
                        latestBooking.id,

                    userId:
                        latestBooking.userId,

                    showId:
                        latestBooking.showId,

                    showSeatIds:
                        releasedSeatIds,

                    extraPayload: {
                        reason:
                            "HOLD_EXPIRED",
                    },
                }

            );


            // --------------------------------------------------
            // 12. Return result
            // --------------------------------------------------

            return {

                released: true,

                bookingId:
                    latestBooking.id,

                releasedSeatIds,

            };

        }
    );
};


export {
    releaseExpiredBookingSeats,
};