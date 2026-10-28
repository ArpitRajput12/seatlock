import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    createRedlockBookingService,
} from "../services/redlockBooking.service.js";

const createRedlockBooking = asyncHandler(async (req, res) => {
    const booking = await createRedlockBookingService(
        req.user.id,
        req.validated.body
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Redlock booking created successfully",
        data: {
            booking,
        },
    });
});

export {
    createRedlockBooking,
};