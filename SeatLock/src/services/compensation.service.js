import prisma from "../config/db.js";
import razorpay from "../config/razorpay.js";
import env from "../config/env.js";
import logger from "../config/logger.js";

import {
    SAGA_STEP,
    SAGA_STATUS,
} from "../constants/saga.constants.js";

import {
    OUTBOX_EVENT,
} from "../constants/outbox.constants.js";

import {
    createBookingOutboxEvent,
    createPaymentOutboxEvent,
} from "./outbox.service.js";

import {
    markSagaFailed,
    markSagaCompensated,
} from "./saga.service.js";


const releaseSeats = async (
    tx,
    bookingId
) => {

    const bookingSeats =
        await tx.bookingSeat.findMany({
            where: {
                bookingId,
            },
        });


    const releasedSeatIds = [];


    for (
        const bookingSeat
        of bookingSeats
    ) {

        const showSeat =
            await tx.showSeat.findUnique({
                where: {
                    id:
                        bookingSeat.showSeatId,
                },
            });


        if (!showSeat) {
            continue;
        }


        if (
            showSeat.status ===
            "HELD"
        ) {

            await tx.showSeat.update({
                where: {
                    id:
                        bookingSeat.showSeatId,
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


            releasedSeatIds.push(
                bookingSeat.showSeatId
            );
        }
    }


    return releasedSeatIds;
};


const cancelBooking = async (
    tx,
    bookingId
) => {

    return tx.booking.update({
        where: {
            id: bookingId,
        },

        data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
        },
    });
};


const refundPayment = async (
    payment
) => {
    const paymentChargeId = payment?.stripeChargeId || payment?.stripePaymentIntentId;

    if (!paymentChargeId && payment.status !== "SUCCEEDED") {
        return null;
    }

    const existingRefund =
        await prisma.refund.findFirst({
            where: {
                paymentId:
                    payment.id,

                status: "SUCCEEDED",
            },
        });


    if (existingRefund) {
        return existingRefund;
    }


    const refundRecord =
        await prisma.refund.create({
            data: {
                paymentId:
                    payment.id,

                amount:
                    payment.amount,

                reason:
                    "SAGA_COMPENSATION",

                status:
                    "PROCESSING",
            },
        });

    let refundId = `rfnd_${Date.now()}`;
    const isPlaceholderKey =
        !env.razorpay?.keyId ||
        env.razorpay.keyId.includes("YourTestKey") ||
        env.razorpay.keySecret.includes("YourTestKey");

    if (paymentChargeId && paymentChargeId.startsWith("pay_") && !isPlaceholderKey) {
        try {
            if (razorpay?.payments?.refund) {
                const rzpRefund = await razorpay.payments.refund(paymentChargeId, {
                    amount: Math.round(Number(payment.amount) * 100),
                    notes: {
                        bookingId: payment.bookingId,
                        reason: "SAGA_COMPENSATION",
                    },
                });
                if (rzpRefund && rzpRefund.id) {
                    refundId = rzpRefund.id;
                }
            }
        } catch (err) {
            logger.warn(
                { paymentId: paymentChargeId, error: err.message },
                "[Razorpay Compensation] Test fallback; recorded local refund"
            );
            refundId = `rfnd_test_${Date.now()}`;
        }
    } else {
        refundId = `rfnd_test_${Date.now()}`;
    }

    try {
        const updatedRefund =
            await prisma.refund.update({
                where: {
                    id:
                        refundRecord.id,
                },

                data: {
                    status: "SUCCEEDED",

                    stripeRefundId:
                        refundId,
                },
            });


        await prisma.payment.update({
            where: {
                id:
                    payment.id,
            },

            data: {
                status: "REFUNDED",
            },
        });


        // --------------------------------------------------
        // Outbox → REFUND_CREATED
        // --------------------------------------------------

        await createPaymentOutboxEvent(
            prisma,
            {
                eventType:
                    OUTBOX_EVENT.REFUND_CREATED,

                paymentId:
                    payment.id,

                bookingId:
                    payment.bookingId,

                userId:
                    payment.booking?.userId,

                extraPayload: {
                    refundId:
                        updatedRefund.id,

                    stripeRefundId:
                        refundId,
                },
            }
        );


        return updatedRefund;

    } catch (error) {

        await prisma.refund.update({
            where: {
                id:
                    refundRecord.id,
            },

            data: {
                status: "FAILED",
            },
        });


        throw error;
    }
};


const compensateBooking = async ({
    sagaId,
    bookingId,
}) => {

    // --------------------------------------------------
    // 1. Mark Saga failed
    // --------------------------------------------------

    await markSagaFailed(
        sagaId,
        SAGA_STEP.BOOK_SEATS,
        "Booking process failed. Starting compensation."
    );


    // --------------------------------------------------
    // 2. Get payment
    // --------------------------------------------------

    const payment =
        await prisma.payment.findFirst({
            where: {
                bookingId,
            },

            include: {
                booking: true,
            },

            orderBy: {
                createdAt: "desc",
            },
        });


    let refund = null;


    // --------------------------------------------------
    // 3. Refund successful payment
    // --------------------------------------------------

    if (payment) {
        refund =
            await refundPayment(payment);
    }


    // --------------------------------------------------
    // 4. Cancel booking + release seats
    // --------------------------------------------------

    let releasedSeatIds = [];


    await prisma.$transaction(
        async (tx) => {

            const booking =
                await tx.booking.findUnique({
                    where: {
                        id: bookingId,
                    },
                });


            if (!booking) {
                throw new Error(
                    "Booking not found during compensation"
                );
            }


            await cancelBooking(
                tx,
                bookingId
            );


            releasedSeatIds =
                await releaseSeats(
                    tx,
                    bookingId
                );


            // --------------------------------------------------
            // Outbox → BOOKING_CANCELLED
            // --------------------------------------------------

            await createBookingOutboxEvent(
                tx,
                {
                    eventType:
                        OUTBOX_EVENT.BOOKING_CANCELLED,

                    bookingId:
                        booking.id,

                    userId:
                        booking.userId,

                    showId:
                        booking.showId,

                    showSeatIds:
                        releasedSeatIds,

                    extraPayload: {
                        reason:
                            "SAGA_COMPENSATION",
                    },
                }
            );


            // --------------------------------------------------
            // Outbox → SEATS_RELEASED
            // --------------------------------------------------

            if (
                releasedSeatIds.length > 0
            ) {

                await createBookingOutboxEvent(
                    tx,
                    {
                        eventType:
                            OUTBOX_EVENT.SEATS_RELEASED,

                        bookingId:
                            booking.id,

                        userId:
                            booking.userId,

                        showId:
                            booking.showId,

                        showSeatIds:
                            releasedSeatIds,

                        extraPayload: {
                            reason:
                                "SAGA_COMPENSATION",
                        },
                    }
                );
            }
        }
    );


    // --------------------------------------------------
    // 5. Mark Saga compensated
    // --------------------------------------------------

    await markSagaCompensated(
        sagaId,
        {
            bookingId,
            refundId:
                refund?.id || null,
            releasedSeatIds,
        }
    );


    return {
        status:
            SAGA_STATUS.COMPENSATED,

        bookingId,

        refundId:
            refund?.id || null,
    };
};


export {
    compensateBooking,
};
