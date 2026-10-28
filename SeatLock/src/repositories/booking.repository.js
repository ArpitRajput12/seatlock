import prisma from "../config/db.js";

const createBooking = async (bookingData) => {
    return prisma.booking.create({
        data: bookingData,
    });
};

const findBookingById = async (bookingId) => {
    return prisma.booking.findUnique({
        where: {
            id: bookingId,
        },
        include: {
            bookingSeats: {
                include: {
                    showSeat: {
                        include: {
                            seat: true,
                        },
                    },
                },
            },
            show: {
                include: {
                    movie: true,
                    screen: {
                        include: {
                            theater: true,
                        },
                    },
                },
            },
            payments: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });
};

const findBookingByNumber = async (
    bookingNumber
) => {
    return prisma.booking.findUnique({
        where: {
            bookingNumber,
        },
    });
};

const findUserBookings = async (userId) => {
    return prisma.booking.findMany({
        where: {
            userId,
        },
        include: {
            show: {
                include: {
                    movie: true,
                    screen: {
                        include: {
                            theater: true,
                        },
                    },
                },
            },
            bookingSeats: {
                include: {
                    showSeat: {
                        include: {
                            seat: true,
                        },
                    },
                },
            },
            payments: {
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

const updateBooking = async (
    bookingId,
    bookingData
) => {
    return prisma.booking.update({
        where: {
            id: bookingId,
        },
        data: bookingData,
    });
};

const createBookingSeats = async (
    bookingSeats
) => {
    return prisma.bookingSeat.createMany({
        data: bookingSeats,
    });
};

export {
    createBooking,
    findBookingById,
    findBookingByNumber,
    findUserBookings,
    updateBooking,
    createBookingSeats,
};