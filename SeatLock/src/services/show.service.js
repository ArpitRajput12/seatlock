import {
    createShow,
    findShowById,
    findActiveShowById,
    findShows,
    findOverlappingShow,
    updateShow,
    deactivateShow,
} from "../repositories/show.repository.js";

import prisma from "../config/db.js";

import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const createShowService = async (showData) => {
    // Check movie
    const movie = await prisma.movie.findFirst({
        where: {
            id: showData.movieId,
            isActive: true,
        },
    });

    if (!movie) {
        throw new AppError(
            "Movie not found or inactive",
            HTTP_STATUS.NOT_FOUND
        );
    }

    // Check screen
    const screen = await prisma.screen.findFirst({
        where: {
            id: showData.screenId,
            isActive: true,
        },
    });

    if (!screen) {
        throw new AppError(
            "Screen not found or inactive",
            HTTP_STATUS.NOT_FOUND
        );
    }

    // Check overlapping show
    const overlappingShow =
        await findOverlappingShow({
            screenId: showData.screenId,
            startTime: showData.startTime,
            endTime: showData.endTime,
        });

    if (overlappingShow) {
        throw new AppError(
            "Another show is already scheduled on this screen during this time",
            HTTP_STATUS.CONFLICT
        );
    }

    const show = await createShow(showData);

    return show;
};

const getShowById = async (showId) => {
    const show = await findActiveShowById(showId);

    if (!show) {
        throw new AppError(
            "Show not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    return show;
};

const getAllShows = async (filters) => {
    return findShows(filters);
};

const updateShowService = async (
    showId,
    showData
) => {
    const existingShow =
        await findShowById(showId);

    if (!existingShow) {
        throw new AppError(
            "Show not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    if (!existingShow.isActive) {
        throw new AppError(
            "Show is inactive",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    const startTime =
        showData.startTime ??
        existingShow.startTime;

    const endTime =
        showData.endTime ??
        existingShow.endTime;

    if (endTime <= startTime) {
        throw new AppError(
            "End time must be after start time",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    // Check overlapping show after update
    if (
        showData.startTime ||
        showData.endTime
    ) {
        const overlappingShow =
            await findOverlappingShow({
                screenId: existingShow.screenId,
                startTime,
                endTime,
                excludeShowId: showId,
            });

        if (overlappingShow) {
            throw new AppError(
                "Another show is already scheduled on this screen during this time",
                HTTP_STATUS.CONFLICT
            );
        }
    }

    const show = await updateShow(
        showId,
        showData
    );

    return show;
};

const deleteShowService = async (showId) => {
    const existingShow =
        await findShowById(showId);

    if (!existingShow) {
        throw new AppError(
            "Show not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    if (!existingShow.isActive) {
        throw new AppError(
            "Show is already inactive",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    const show =
        await deactivateShow(showId);

    return show;
};

export {
    createShowService,
    getShowById,
    getAllShows,
    updateShowService,
    deleteShowService,
};
