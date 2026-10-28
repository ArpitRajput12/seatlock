import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
    getPaymentByIdService,
    createRazorpayOrderService,
    verifyRazorpayPaymentService,
} from "../services/payment.service.js";

/**
 * Fetch Payment by ID
 */
const getPayment = asyncHandler(async (req, res) => {
    const payment = await getPaymentByIdService(
        req.validated.params.paymentId,
        req.user.id
    );

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        statusCode: HTTP_STATUS.OK,
        message: "Payment fetched successfully",
        data: { payment },
    });
});

/**
 * Create Razorpay Order
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
    let { bookingId, showId, seatIds, showSeatIds, totalAmount, amount } = req.body;

    if (showId && typeof showId === "string") {
        showId = showId.trim().replace(/\s+/g, "-");
    }

    const result = await createRazorpayOrderService(req.user.id, {
        bookingId,
        showId,
        seatIds,
        showSeatIds,
        amount: totalAmount || amount,
    });

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        statusCode: HTTP_STATUS.OK,
        orderId: result.orderId,
        amount: result.amount,
        currency: result.currency || "INR",
        key: result.key,
        keyId: result.keyId,
        bookingId: result.bookingId,
        bookingNumber: result.bookingNumber,
        data: result,
    });
});

/**
 * Verify Razorpay Payment Signature (HMAC SHA256)
 */
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    let {
        bookingId,
        holdToken,
        showId,
        selectedSeats,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = req.body;

    if (showId && typeof showId === "string") {
        showId = showId.trim().replace(/\s+/g, "-");
    }

    const result = await verifyRazorpayPaymentService(req.user.id, {
        bookingId,
        holdToken,
        showId,
        selectedSeats,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    });

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        statusCode: HTTP_STATUS.OK,
        message: result.message || "Congratulations! Your seat is booked",
        bookingReference: result.bookingReference || result.bookingNumber,
        ticket: result.ticket,
        ticketData: result.ticketData,
        booking: result.booking,
        data: result,
    });
});

export {
    getPayment,
    createRazorpayOrder,
    verifyRazorpayPayment,
};
