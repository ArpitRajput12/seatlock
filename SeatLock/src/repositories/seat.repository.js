import prisma from "../config/db.js";

const createSeat = async (seatData) => {
    return prisma.seat.create({
        data: seatData,
    });
};

const findSeatById = async (seatId) => {
    return prisma.seat.findUnique({
        where: {
            id: seatId,
        },
    });
};

const findSeatsByScreen = async (screenId) => {
    return prisma.seat.findMany({
        where: {
            screenId,
        },
        orderBy: [
            {
                rowLabel: "asc",
            },
            {
                seatNumber: "asc",
            },
        ],
    });
};

const updateSeat = async (seatId, seatData) => {
    return prisma.seat.update({
        where: {
            id: seatId,
        },
        data: seatData,
    });
};

const deleteSeat = async (seatId) => {
    return prisma.seat.delete({
        where: {
            id: seatId,
        },
    });
};

const countSeatsByScreen = async (screenId) => {
    return prisma.seat.count({
        where: {
            screenId,
        },
    });
};

export {
    createSeat,
    findSeatById,
    findSeatsByScreen,
    updateSeat,
    deleteSeat,
    countSeatsByScreen,
};