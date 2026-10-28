import prisma from "../config/db.js";

const createTheater = async (theaterData) => {
    return prisma.theater.create({
        data: theaterData,
    });
};

const findTheaterById = async (theaterId) => {
    return prisma.theater.findUnique({
        where: { id: theaterId },
    });
};

const findActiveTheaterById = async (theaterId) => {
    return prisma.theater.findFirst({
        where: {
            id: theaterId,
            isActive: true,
        },
    });
};

const findTheaters = async ({ skip, take, search, city, isActive }) => {
    const where = {};

    if (isActive !== undefined) {
        where.isActive = isActive;
    } else {
        where.isActive = true;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
        ];
    }

    if (city) {
        where.city = {
            equals: city,
            mode: "insensitive",
        };
    }

    const [theaters, total] = await prisma.$transaction([
        prisma.theater.findMany({
            where,
            orderBy: { name: "asc" },
            skip,
            take,
        }),
        prisma.theater.count({ where }),
    ]);

    return {
        theaters,
        total,
    };
};

const updateTheater = async (theaterId, theaterData) => {
    return prisma.theater.update({
        where: { id: theaterId },
        data: theaterData,
    });
};

const deactivateTheater = async (theaterId) => {
    return prisma.theater.update({
        where: { id: theaterId },
        data: { isActive: false },
    });
};

export {
    createTheater,
    findTheaterById,
    findActiveTheaterById,
    findTheaters,
    updateTheater,
    deactivateTheater,
};
