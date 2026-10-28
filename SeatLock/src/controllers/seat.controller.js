import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    createSeatService,
    getSeatById,
    getSeatsByScreen,
    updateSeatService,
    deleteSeatService,
} from "../services/seat.service.js";

const createSeat = asyncHandler(async (req, res) => {
    const seat = await createSeatService(req.validated.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Seat created successfully",
        data: { seat },
    });
});

const getSeat = asyncHandler(async (req, res) => {
    const seat = await getSeatById(
        req.validated.params.seatId
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Seat fetched successfully",
        data: { seat },
    });
});

const getScreenSeats = asyncHandler(async (req, res) => {
    const seats = await getSeatsByScreen(
        req.validated.params.screenId
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Seats fetched successfully",
        data: seats,
    });
});

const updateSeat = asyncHandler(async (req, res) => {
    const seat = await updateSeatService(
        req.validated.params.seatId,
        req.validated.body
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Seat updated successfully",
        data: { seat },
    });
});

const deleteSeat = asyncHandler(async (req, res) => {
    const seat = await deleteSeatService(
        req.validated.params.seatId
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Seat deleted successfully",
        data: { seat },
    });
});

export {
    createSeat,
    getSeat,
    getScreenSeats,
    updateSeat,
    deleteSeat,
};