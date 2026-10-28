import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    generateShowSeats,
    getShowSeatById,
    getShowSeats,
    getAvailableSeats,
} from "../services/showSeat.service.js";

const generateSeats = asyncHandler(async (req, res) => {
    const showId = req.validated?.body?.showId || req.body?.showId;
    const showSeats = await generateShowSeats(showId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Show seats generated successfully",
        data: showSeats,
    });
});

const getShowSeat = asyncHandler(async (req, res) => {
    const showSeatId = req.validated?.params?.showSeatId || req.params?.showSeatId;
    const showSeat = await getShowSeatById(showSeatId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Show seat fetched successfully",
        data: { showSeat },
    });
});

const getShowSeatsList = asyncHandler(async (req, res) => {
    const showId = req.validated?.params?.showId || req.params?.showId || req.params?.id;
    const showSeats = await getShowSeats(showId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Show seats fetched successfully",
        data: showSeats,
    });
});

const getAvailableShowSeats = asyncHandler(async (req, res) => {
    const showId = req.validated?.params?.showId || req.params?.showId || req.params?.id;
    const showSeats = await getAvailableSeats(showId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Available seats fetched successfully",
        data: showSeats,
    });
});

export {
    generateSeats,
    getShowSeat,
    getShowSeatsList,
    getAvailableShowSeats,
};
