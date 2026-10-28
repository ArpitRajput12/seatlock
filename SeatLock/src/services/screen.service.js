import {
    createScreen,
    findScreenById,
    findActiveScreenById,
    findScreensByTheater,
    updateScreen,
    deactivateScreen,
} from "../repositories/screen.repository.js";
import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const createScreenService = async (screenData) => {
    const theater = await prisma.theater.findFirst({
        where: {
            id: screenData.theaterId,
            isActive: true,
        },
    });

    if (!theater) {
        throw new AppError("Theater not found or inactive", HTTP_STATUS.NOT_FOUND);
    }

    const existingScreen = await prisma.screen.findFirst({
        where: {
            theaterId: screenData.theaterId,
            name: screenData.name,
            isActive: true,
        },
    });

    if (existingScreen) {
        throw new AppError(
            "Screen with this name already exists in this theater",
            HTTP_STATUS.CONFLICT
        );
    }

    return createScreen(screenData);
};

const getScreenById = async (screenId) => {
    const screen = await findActiveScreenById(screenId);
    if (!screen) {
        throw new AppError("Screen not found", HTTP_STATUS.NOT_FOUND);
    }
    return screen;
};

const getScreensByTheater = async (theaterId) => {
    const theater = await prisma.theater.findFirst({
        where: {
            id: theaterId,
            isActive: true,
        },
    });

    if (!theater) {
        throw new AppError("Theater not found or inactive", HTTP_STATUS.NOT_FOUND);
    }

    return findScreensByTheater(theaterId);
};

const updateScreenService = async (screenId, screenData) => {
    const existingScreen = await findScreenById(screenId);

    if (!existingScreen) {
        throw new AppError("Screen not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!existingScreen.isActive) {
        throw new AppError("Screen is inactive", HTTP_STATUS.BAD_REQUEST);
    }

    if (screenData.name && screenData.name !== existingScreen.name) {
        const duplicateScreen = await prisma.screen.findFirst({
            where: {
                theaterId: existingScreen.theaterId,
                name: screenData.name,
                isActive: true,
                id: { not: screenId },
            },
        });

        if (duplicateScreen) {
            throw new AppError(
                "Screen with this name already exists in this theater",
                HTTP_STATUS.CONFLICT
            );
        }
    }

    return updateScreen(screenId, screenData);
};

const deleteScreenService = async (screenId) => {
    const existingScreen = await findScreenById(screenId);

    if (!existingScreen) {
        throw new AppError("Screen not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!existingScreen.isActive) {
        throw new AppError("Screen is already inactive", HTTP_STATUS.BAD_REQUEST);
    }

    return deactivateScreen(screenId);
};

export {
    createScreenService,
    getScreenById,
    getScreensByTheater,
    updateScreenService,
    deleteScreenService,
};
