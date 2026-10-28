import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
    createMovieService,
    getMovieById,
    getMovies,
    updateMovieService,
    deleteMovieService,
} from "../services/movie.service.js";

const createMovie = asyncHandler(async (req, res) => {
    const payload = req.validated?.body || req.body;
    const movie = await createMovieService(payload);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Movie created successfully",
        data: { movie },
    });
});

const getAllMovies = asyncHandler(async (req, res) => {
    const query = req.validated?.query || req.query || {};
    const result = await getMovies(query);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Movies fetched successfully",
        data: result.movies,
        meta: result.pagination,
    });
});

const getMovie = asyncHandler(async (req, res) => {
    const params = req.validated?.params || req.params || {};
    const movie = await getMovieById(params.movieId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Movie fetched successfully",
        data: { movie },
    });
});

const updateMovie = asyncHandler(async (req, res) => {
    const params = req.validated?.params || req.params || {};
    const body = req.validated?.body || req.body || {};
    const movie = await updateMovieService(params.movieId, body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Movie updated successfully",
        data: { movie },
    });
});

const deleteMovie = asyncHandler(async (req, res) => {
    const params = req.validated?.params || req.params || {};
    const movie = await deleteMovieService(params.movieId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Movie deleted successfully",
        data: { movie },
    });
});

export {
    createMovie,
    getAllMovies,
    getMovie,
    updateMovie,
    deleteMovie,
};
