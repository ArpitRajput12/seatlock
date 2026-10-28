import prisma from "../config/db.js";

const createShowSeat = async (showSeatData) => {
    return prisma.showSeat.create({
        data: showSeatData,
    });
};

const createManyShowSeats = async (showSeats) => {
    return prisma.showSeat.createMany({
        data: showSeats,
        skipDuplicates: true,
    });
};

const findShowSeatById = async (showSeatId) => {
    return prisma.showSeat.findUnique({
        where: {
            id: showSeatId,
        },
        include: {
            seat: true,
            show: true,
        },
    });
};

const findShowSeatsByShow = async (showId) => {
    return prisma.showSeat.findMany({
        where: {
            showId,
        },
        include: {
            seat: true,
        },
        orderBy: [
            {
                seat: {
                    rowLabel: "asc",
                },
            },
            {
                seat: {
                    seatNumber: "asc",
                },
            },
        ],
    });
};

const findAvailableShowSeats = async (showId) => {
    return prisma.showSeat.findMany({
        where: {
            showId,
            status: "AVAILABLE",
        },
        include: {
            seat: true,
        },
        orderBy: [
            {
                seat: {
                    rowLabel: "asc",
                },
            },
            {
                seat: {
                    seatNumber: "asc",
                },
            },
        ],
    });
};

const updateShowSeat = async (
    showSeatId,
    showSeatData
) => {
    return prisma.showSeat.update({
        where: {
            id: showSeatId,
        },
        data: showSeatData,
    });
};

export {
    createShowSeat,
    createManyShowSeats,
    findShowSeatById,
    findShowSeatsByShow,
    findAvailableShowSeats,
    updateShowSeat,
};