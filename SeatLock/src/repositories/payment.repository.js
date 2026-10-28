import prisma from "../config/db.js";

/**
 * Persists a new payment transaction record.
 * Supports passing either prisma client instance or an active transaction client (tx).
 */
const createPayment = async (db, paymentData) => {
    return (db || prisma).payment.create({
        data: paymentData,
    });
};

const findPaymentById = async (paymentId) => {
    return prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            booking: {
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
            },
        },
    });
};

const findPaymentByBookingId = async (bookingId) => {
    return prisma.payment.findFirst({
        where: { bookingId },
        orderBy: { createdAt: "desc" },
    });
};

const findPaymentByGatewayOrderId = async (orderId) => {
    return prisma.payment.findFirst({
        where: { stripePaymentIntentId: orderId },
    });
};

const updatePayment = async (paymentId, paymentData) => {
    return prisma.payment.update({
        where: { id: paymentId },
        data: paymentData,
    });
};

export {
    createPayment,
    findPaymentById,
    findPaymentByBookingId,
    findPaymentByGatewayOrderId,
    findPaymentByGatewayOrderId as findPaymentByStripePaymentIntentId,
    updatePayment,
};
