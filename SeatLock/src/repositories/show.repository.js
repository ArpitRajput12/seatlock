import prisma from "../config/db.js";

const createShow = async (showData) => {
    return prisma.show.create({
        data: showData,
    });
};

const findShowById = async (showId) => {
    return prisma.show.findUnique({
        where: {
            id: showId,
        },
    });
};

const findActiveShowById = async (showId) => {
    return prisma.show.findFirst({
        where: {
            id: showId,
            isActive: true,
        },
    });
};

const findShows = async ({
    movieId,
    screenId,
    from,
    to,
}) => {
    const where = {
        isActive: true,
    };

    if (movieId) {
        where.movieId = movieId;
    }

    if (screenId) {
        where.screenId = screenId;
    }

    if (from || to) {
        where.startTime = {};

        if (from) {
            where.startTime.gte = from;
        }

        if (to) {
            where.startTime.lte = to;
        }
    }

    return prisma.show.findMany({
        where,
        orderBy: {
            startTime: "asc",
        },
        include: {
            movie: true,
            screen: {
                include: {
                    theater: true,
                },
            },
        },
    });
};

const findOverlappingShow = async ({
    screenId,
    startTime,
    endTime,
    excludeShowId = null,
}) => {
    const where = {
        screenId,
        isActive: true,

        AND: [
            {
                startTime: {
                    lt: endTime,
                },
            },
            {
                endTime: {
                    gt: startTime,
                },
            },
        ],
    };

    if (excludeShowId) {
        where.id = {
            not: excludeShowId,
        };
    }

    return prisma.show.findFirst({
        where,
    });
};

const updateShow = async (showId, showData) => {
    return prisma.show.update({
        where: {
            id: showId,
        },
        data: showData,
    });
};

const deactivateShow = async (showId) => {
    return prisma.show.update({
        where: {
            id: showId,
        },
        data: {
            isActive: false,
        },
    });
};

export {
    createShow,
    findShowById,
    findActiveShowById,
    findShows,
    findOverlappingShow,
    updateShow,
    deactivateShow,
};