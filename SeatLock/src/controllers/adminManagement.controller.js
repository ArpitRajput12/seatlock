import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    createTheaterAdminService,
    getTheatersAdminService,
    updateTheaterAdminService,
    deleteTheaterAdminService,
    createScreenWithLayoutService,
    updateScreenSeatsService,
    getScreenWithSeatsAdminService,
    scheduleShowAdminService,
    getAdminStatsService,
    getMoviesAdminService,
    createMovieAdminService,
    updateMovieAdminService,
    deleteMovieAdminService,
    getShowsAdminService,
    cancelShowAdminService,
    getRecentBookingsAdminService,
} from "../services/adminManagement.service.js";

const createTheaterAdmin = asyncHandler(async (req, res) => {
    const theater = await createTheaterAdminService(req.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Theater created successfully",
        data: { theater },
    });
});

const getTheatersAdmin = asyncHandler(async (req, res) => {
    const theaters = await getTheatersAdminService();

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Theaters fetched successfully",
        data: theaters,
    });
});

const updateTheaterAdmin = asyncHandler(async (req, res) => {
    const theaterId = req.params.id || req.params.theaterId;
    const theater = await updateTheaterAdminService(theaterId, req.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Theater updated successfully",
        data: { theater },
    });
});

const deleteTheaterAdmin = asyncHandler(async (req, res) => {
    const theaterId = req.params.id || req.params.theaterId;
    const theater = await deleteTheaterAdminService(theaterId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Theater deactivated successfully",
        data: { theater },
    });
});

const createScreenWithLayout = asyncHandler(async (req, res) => {
    const theaterId = req.params.theaterId || req.body.theaterId;
    const screen = await createScreenWithLayoutService(theaterId, req.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Screen and seat layout created successfully",
        data: { screen },
    });
});

const updateScreenSeats = asyncHandler(async (req, res) => {
    const screenId = req.params.screenId || req.params.id;
    const screen = await updateScreenSeatsService(screenId, req.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Screen seats updated successfully",
        data: { screen },
    });
});

const getScreenWithSeatsAdmin = asyncHandler(async (req, res) => {
    const screenId = req.params.screenId || req.params.id;
    const screen = await getScreenWithSeatsAdminService(screenId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Screen details fetched successfully",
        data: { screen },
    });
});

const scheduleShowAdmin = asyncHandler(async (req, res) => {
    const show = await scheduleShowAdminService(req.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Show scheduled and seats provisioned successfully",
        data: { show },
    });
});

const getAdminStats = asyncHandler(async (req, res) => {
    const stats = await getAdminStatsService();

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Admin statistics fetched successfully",
        data: stats,
    });
});

const getMoviesAdmin = asyncHandler(async (req, res) => {
    const movies = await getMoviesAdminService();

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Movies fetched successfully",
        data: movies,
    });
});

const createMovieAdmin = asyncHandler(async (req, res) => {
    const movie = await createMovieAdminService(req.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Movie created successfully",
        data: { movie },
    });
});

const updateMovieAdmin = asyncHandler(async (req, res) => {
    const movieId = req.params.id || req.params.movieId;
    const movie = await updateMovieAdminService(movieId, req.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Movie updated successfully",
        data: { movie },
    });
});

const deleteMovieAdmin = asyncHandler(async (req, res) => {
    const movieId = req.params.id || req.params.movieId;
    const movie = await deleteMovieAdminService(movieId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Movie deactivated successfully",
        data: { movie },
    });
});

const getShowsAdmin = asyncHandler(async (req, res) => {
    const shows = await getShowsAdminService();

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Shows fetched successfully",
        data: shows,
    });
});

const cancelShowAdmin = asyncHandler(async (req, res) => {
    const showId = req.params.id || req.params.showId;
    const show = await cancelShowAdminService(showId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Show cancelled successfully",
        data: { show },
    });
});

const getRecentBookingsAdmin = asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const bookings = await getRecentBookingsAdminService(limit);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Recent bookings fetched successfully",
        data: bookings,
    });
});

export {
    createTheaterAdmin,
    getTheatersAdmin,
    updateTheaterAdmin,
    deleteTheaterAdmin,
    createScreenWithLayout,
    updateScreenSeats,
    getScreenWithSeatsAdmin,
    scheduleShowAdmin,
    getAdminStats,
    getMoviesAdmin,
    createMovieAdmin,
    updateMovieAdmin,
    deleteMovieAdmin,
    getShowsAdmin,
    cancelShowAdmin,
    getRecentBookingsAdmin,
};

