import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    createOptimisticBookingService,
} from "../services/optimisticBooking.service.js";

const createOptimisticBooking = asyncHandler(async (req, res) => {
    const booking = await createOptimisticBookingService(
        req.user.id,
        req.validated.body
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Optimistic booking created successfully",
        data: {
            booking,
        },
    });
});

export {
    createOptimisticBooking,
};