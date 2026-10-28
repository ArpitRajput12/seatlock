import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    createShowService,
    getShowById,
    getAllShows,
    updateShowService,
    deleteShowService,
} from "../services/show.service.js";

import {
    getCachedShows,
    getCachedShow,
    invalidateShowCache,
    invalidateAllShowCache,
} from "../services/showCache.service.js";

// --------------------------------------------------
// CREATE SHOW
// --------------------------------------------------

const createShow = asyncHandler(async (req, res) => {
    const body = req.validated?.body || req.body || {};
    const show = await createShowService(body);

    await invalidateAllShowCache();

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Show created successfully",
        data: { show },
    });
});

// --------------------------------------------------
// GET SINGLE SHOW
// --------------------------------------------------

const getShow = asyncHandler(async (req, res) => {
    const params = req.validated?.params || req.params || {};
    const showId = params.showId;

    const result = await getCachedShow(
        showId,
        () => getShowById(showId)
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Show fetched successfully",
        data: {
            show: result.data,
        },
    });
});

// --------------------------------------------------
// GET ALL SHOWS
// --------------------------------------------------

const getShows = asyncHandler(async (req, res) => {
    const query = req.validated?.query || req.query || {};

    const result = await getCachedShows(
        query,
        () => getAllShows(query)
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Shows fetched successfully",
        data: result.data,
    });
});

// --------------------------------------------------
// UPDATE SHOW
// --------------------------------------------------

const updateShow = asyncHandler(async (req, res) => {
    const params = req.validated?.params || req.params || {};
    const body = req.validated?.body || req.body || {};
    const showId = params.showId;

    const show = await updateShowService(showId, body);

    await invalidateShowCache(showId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Show updated successfully",
        data: { show },
    });
});

// --------------------------------------------------
// DELETE SHOW
// --------------------------------------------------

const deleteShow = asyncHandler(async (req, res) => {
    const params = req.validated?.params || req.params || {};
    const showId = params.showId;

    const show = await deleteShowService(showId);

    await invalidateShowCache(showId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Show deleted successfully",
        data: { show },
    });
});

export {
    createShow,
    getShow,
    getShows,
    updateShow,
    deleteShow,
};
