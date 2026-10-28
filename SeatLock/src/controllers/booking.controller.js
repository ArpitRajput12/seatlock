import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    createBookingService,
    getBookingByIdService,
    getMyBookingsService,
} from "../services/booking.service.js";

import { cancelUserBookingService } from "../services/bookingCancellation.service.js";

const createBooking = asyncHandler(async (req, res) => {
    const booking = await createBookingService(
        req.user.id,
        req.validated.body
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Booking created successfully",
        data: { booking },
    });
});

const getBooking = asyncHandler(async (req, res) => {
    const booking = await getBookingByIdService(
        req.validated.params.bookingId,
        req.user.id
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Booking fetched successfully",
        data: { booking },
    });
});

const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await getMyBookingsService(
        req.user.id
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Bookings fetched successfully",
        data: { bookings },
    });
});

const cancelBooking = asyncHandler(async (req, res) => {
    let bookingId = req.validated?.params?.bookingId || req.params.bookingId;
    if (bookingId && typeof bookingId === "string") {
        bookingId = bookingId.trim().replace(/\s+/g, "-");
    }
    const { reason } = req.validated?.body || req.body || {};

    const result = await cancelUserBookingService({
        userId: req.user.id,
        bookingId,
        reason,
        isAdmin: req.user.role === "ADMIN",
    });

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Booking cancelled successfully and seats released.",
        refundAmount: result.refundAmount,
        bookingId: result.bookingId,
        data: {
            ...result,
            booking: result.booking,
        },
    });
});

export {
    createBooking,
    getBooking,
    getMyBookings,
    cancelBooking,
};
