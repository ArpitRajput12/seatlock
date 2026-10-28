import {
    createTheater,
    findTheaterById,
    findActiveTheaterById,
    findTheaters,
    updateTheater,
    deactivateTheater,
} from "../repositories/theater.repository.js";
import AppError from "../utils/AppError.js";
import {
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
} from "../constants/app.constants.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const createTheaterService = async (theaterData) => {
    return createTheater(theaterData);
};

const getTheaterById = async (theaterId) => {
    const theater = await findActiveTheaterById(theaterId);
    if (!theater) {
        throw new AppError("Theater not found", HTTP_STATUS.NOT_FOUND);
    }
    return theater;
};

const getTheaters = async ({
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search = "",
    city = "",
    isActive,
}) => {
    const currentPage = Math.max(Number(page) || DEFAULT_PAGE, 1);
    const currentLimit = Math.min(
        Math.max(Number(limit) || DEFAULT_LIMIT, 1),
        MAX_LIMIT
    );
    const skip = (currentPage - 1) * currentLimit;

    const result = await findTheaters({
        skip,
        take: currentLimit,
        search: search.trim(),
        city: city.trim(),
        isActive,
    });

    const totalPages = Math.ceil(result.total / currentLimit);

    return {
        theaters: result.theaters,
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

const updateTheaterService = async (theaterId, theaterData) => {
    const existingTheater = await findTheaterById(theaterId);
    if (!existingTheater) {
        throw new AppError("Theater not found", HTTP_STATUS.NOT_FOUND);
    }
    return updateTheater(theaterId, theaterData);
};

const deleteTheaterService = async (theaterId) => {
    const existingTheater = await findTheaterById(theaterId);
    if (!existingTheater) {
        throw new AppError("Theater not found", HTTP_STATUS.NOT_FOUND);
    }
    if (!existingTheater.isActive) {
        throw new AppError("Theater is already inactive", HTTP_STATUS.BAD_REQUEST);
    }
    return deactivateTheater(theaterId);
};

export {
    createTheaterService,
    getTheaterById,
    getTheaters,
    updateTheaterService,
    deleteTheaterService,
};
