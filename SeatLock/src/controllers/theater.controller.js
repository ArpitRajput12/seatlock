import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
    createTheaterService,
    getTheaterById,
    getTheaters,
    updateTheaterService,
    deleteTheaterService,
} from "../services/theater.service.js";

const createTheater = asyncHandler(async (req, res) => {
    const theater = await createTheaterService(req.validated.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Theater created successfully",
        data: { theater },
    });
});

const getAllTheaters = asyncHandler(async (req, res) => {
    const result = await getTheaters(req.validated.query);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Theaters fetched successfully",
        data: result.theaters,
        meta: result.pagination,
    });
});

const getTheater = asyncHandler(async (req, res) => {
    const theater = await getTheaterById(req.validated.params.theaterId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Theater fetched successfully",
        data: { theater },
    });
});

const updateTheater = asyncHandler(async (req, res) => {
    const theater = await updateTheaterService(
        req.validated.params.theaterId,
        req.validated.body
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Theater updated successfully",
        data: { theater },
    });
});

const deleteTheater = asyncHandler(async (req, res) => {
    const theater = await deleteTheaterService(req.validated.params.theaterId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Theater deleted successfully",
        data: { theater },
    });
});

export {
    createTheater,
    getAllTheaters,
    getTheater,
    updateTheater,
    deleteTheater,
};
