import {
    createMovie,
    findMovieById,
    findActiveMovieById,
    findMovies,
    updateMovie,
    deactivateMovie,
} from "../repositories/movie.repository.js";
import AppError from "../utils/AppError.js";
import {
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
} from "../constants/app.constants.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const createMovieService = async (movieData) => {
    return createMovie(movieData);
};

const getMovieById = async (movieId) => {
    const movie = await findActiveMovieById(movieId);
    if (!movie) {
        throw new AppError("Movie not found", HTTP_STATUS.NOT_FOUND);
    }
    return movie;
};

const getMovies = async ({
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search = "",
    isActive,
}) => {
    const currentPage = Math.max(Number(page) || DEFAULT_PAGE, 1);
    const currentLimit = Math.min(
        Math.max(Number(limit) || DEFAULT_LIMIT, 1),
        MAX_LIMIT
    );
    const skip = (currentPage - 1) * currentLimit;

    const result = await findMovies({
        skip,
        take: currentLimit,
        search: search.trim(),
        isActive,
    });

    const totalPages = Math.ceil(result.total / currentLimit);

    return {
        movies: result.movies,
        pagination: {
            page: currentPage,
            limit: currentLimit,
            total: result.total,
            totalPages,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
        },
    };
};

const updateMovieService = async (movieId, movieData) => {
    const existingMovie = await findMovieById(movieId);
    if (!existingMovie) {
        throw new AppError("Movie not found", HTTP_STATUS.NOT_FOUND);
    }
    return updateMovie(movieId, movieData);
};

const deleteMovieService = async (movieId) => {
    const existingMovie = await findMovieById(movieId);
    if (!existingMovie) {
        throw new AppError("Movie not found", HTTP_STATUS.NOT_FOUND);
    }
    if (!existingMovie.isActive) {
        throw new AppError("Movie is already inactive", HTTP_STATUS.BAD_REQUEST);
    }
    return deactivateMovie(movieId);
};

export {
    createMovieService,
    getMovieById,
    getMovies,
    updateMovieService,
    deleteMovieService,
};
