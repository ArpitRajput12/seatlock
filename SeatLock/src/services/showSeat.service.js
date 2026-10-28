import {
    createManyShowSeats,
    findShowSeatById,
    findShowSeatsByShow,
    findAvailableShowSeats,
} from "../repositories/showSeat.repository.js";

import prisma from "../config/db.js";

import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const generateShowSeats = async (showId) => {
    const show = await prisma.show.findFirst({
        where: {
            id: showId,
            isActive: true,
        },
        include: {
            screen: {
                include: {
                    seats: true,
                },
            },
        },
    });

    if (!show) {
        throw new AppError(
            "Show not found or inactive",
            HTTP_STATUS.NOT_FOUND
        );
    }

    if (show.screen.seats.length === 0) {
        throw new AppError(
            "No seats configured for this screen",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    const showSeats = show.screen.seats.map((seat) => ({
        showId: show.id,
        seatId: seat.id,
        status: "AVAILABLE",
        price: show.basePrice,
    }));

    await createManyShowSeats(showSeats);

    return findShowSeatsByShow(showId);
};

const getShowSeatById = async (showSeatId) => {
    const showSeat =
        await findShowSeatById(showSeatId);

    if (!showSeat) {
        throw new AppError(
            "Show seat not found",
            HTTP_STATUS.NOT_FOUND
        );
    }

    return showSeat;
};

const getShowSeats = async (showId) => {
    const show = await prisma.show.findFirst({
        where: {
            id: showId,
            isActive: true,
        },
    });

    if (!show) {
        throw new AppError(
            "Show not found or inactive",
            HTTP_STATUS.NOT_FOUND
        );
    }

    let seats = await findShowSeatsByShow(showId);
    if (!seats || seats.length === 0) {
        try {
            await generateShowSeats(showId);
            seats = await findShowSeatsByShow(showId);
        } catch {
            // Ignore if generation fails
        }
    }

    return seats || [];
};

const getAvailableSeats = async (showId) => {
    const show = await prisma.show.findFirst({
        where: {
            id: showId,
            isActive: true,
        },
    });

    if (!show) {
        throw new AppError(
            "Show not found or inactive",
            HTTP_STATUS.NOT_FOUND
        );
    }

    return findAvailableShowSeats(showId);
};

export {
    generateShowSeats,
    getShowSeatById,
    getShowSeats,
    getAvailableSeats,
};
