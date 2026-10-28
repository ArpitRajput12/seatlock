import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    holdShowSeatsService,
    releaseShowSeatsService,
} from "../services/seatHold.service.js";

const holdSeats = asyncHandler(async (req, res) => {
    let rawShowId =
        req.validated?.params?.showId ||
        req.validated?.params?.id ||
        req.params?.showId ||
        req.params?.id ||
        req.validated?.body?.showId ||
        req.body?.showId;

    const showId = typeof rawShowId === "string" ? rawShowId.trim().replace(/\s+/g, "-") : rawShowId;
    const { seatIds, showSeatIds, strategy } = req.validated?.body || req.body || {};

    const result = await holdShowSeatsService(req.user.id, {
        showId,
        seatIds,
        showSeatIds,
        strategy,
    });

    const holdData = {
        success: true,
        holdToken: result.holdToken,
        expiresAt: result.holdExpiresAt || result.expiresAt,
        totalAmount: result.totalAmount,
        bookingId: result.bookingId,
        bookingNumber: result.bookingNumber,
        ...result,
    };

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        statusCode: HTTP_STATUS.OK,
        message: "Seats held successfully",
        holdToken: result.holdToken,
        expiresAt: result.holdExpiresAt || result.expiresAt,
        totalAmount: result.totalAmount,
        bookingId: result.bookingId,
        bookingNumber: result.bookingNumber,
        data: holdData,
    });
});

const releaseSeats = asyncHandler(async (req, res) => {
    let rawShowId =
        req.validated?.params?.showId ||
        req.validated?.params?.id ||
        req.params?.showId ||
        req.params?.id ||
        req.validated?.body?.showId ||
        req.body?.showId;

    const showId = typeof rawShowId === "string" ? rawShowId.trim().replace(/\s+/g, "-") : rawShowId;
    const { holdToken, bookingId, seatIds, showSeatIds } =
        req.validated?.body || req.body || {};

    const result = await releaseShowSeatsService({
        showId,
        holdToken,
        bookingId,
        seatIds,
        showSeatIds,
    });

    return res.status(HTTP_STATUS.OK).json({
        success: true,
        statusCode: HTTP_STATUS.OK,
        message: "Seats released successfully",
        data: result,
    });
});

export {
    holdSeats,
    releaseSeats,
};
