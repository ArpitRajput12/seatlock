import {
    createSeat,
    findSeatById,
    findSeatsByScreen,
    updateSeat,
    deleteSeat,
    countSeatsByScreen,
} from "../repositories/seat.repository.js";

import prisma from "../config/db.js";

import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const createSeatService = async (seatData) => {
    const screen = await prisma.screen.findFirst({
        where: {
            id: seatData.screenId,
            isActive: true,
        },
    });

    if (!screen) {
        throw new AppError(
            "Screen not found or inactive",
            HTTP_STATUS.NOT_FOUND
        );
    }

    const existingSeat = await prisma.seat.findFirst({
        where: {
            screenId: seatData.screenId,
            rowLabel: seatData.rowLabel,
            seatNumber: seatData.seatNumber,
        },
    });

    if (existingSeat) {
        throw new AppError(
            "Seat already exists in this screen",
            HTTP_STATUS.CONFLICT
        );
    }

    const currentSeatCount =
        await countSeatsByScreen(seatData.screenId);

    if (currentSeatCount >= screen.totalSeats) {
        throw new AppError(
            "Screen has reached its maximum seat capacity",
            HTTP_STATUS.CONFLICT
        );
    }

    const seat = await createSeat(seatData);

    return seat;
};

const getSeatById = async (seatId) => {
    const seat = await findSeatById(seatId);

    if (!seat) {
        throw new AppError(
            "Seat not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    return seat;
};

const getSeatsByScreen = async (screenId) => {
    const screen = await prisma.screen.findFirst({
        where: {
            id: screenId,
            isActive: true,
        },
    });

    if (!screen) {
        throw new AppError(
            "Screen not found or inactive",
            HTTP_STATUS.NOT_FOUND
        );
    }

    const seats = await findSeatsByScreen(screenId);

    return seats;
};

const updateSeatService = async (
    seatId,
    seatData
) => {
    const existingSeat =
        await findSeatById(seatId);

    if (!existingSeat) {
        throw new AppError(
            "Seat not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    if (
        seatData.rowLabel ||
        seatData.seatNumber
    ) {
        const rowLabel =
            seatData.rowLabel ??
            existingSeat.rowLabel;

        const seatNumber =
            seatData.seatNumber ??
            existingSeat.seatNumber;

        const duplicateSeat =
            await prisma.seat.findFirst({
                where: {
                    screenId: existingSeat.screenId,
                    rowLabel,
                    seatNumber,
                    id: {
                        not: seatId,
                    },
                },
            });

        if (duplicateSeat) {
            throw new AppError(
                "Another seat with this position already exists",
                HTTP_STATUS.CONFLICT
            );
        }
    }

    const seat = await updateSeat(
        seatId,
        seatData
    );

    return seat;
};

const deleteSeatService = async (seatId) => {
    const existingSeat =
        await findSeatById(seatId);

    if (!existingSeat) {
        throw new AppError(
            "Seat not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    const seat = await deleteSeat(seatId);

    return seat;
};

export {
    createSeatService,
    getSeatById,
    getSeatsByScreen,
    updateSeatService,
    deleteSeatService,
};