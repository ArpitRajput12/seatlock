import prisma from "../config/db.js";

const createScreen = async (screenData) => {
    return prisma.screen.create({
        data: screenData,
    });
};

const findScreenById = async (screenId) => {
    return prisma.screen.findUnique({
        where: { id: screenId },
    });
};

const findActiveScreenById = async (screenId) => {
    return prisma.screen.findFirst({
        where: {
            id: screenId,
            isActive: true,
        },
    });
};

const findScreensByTheater = async (theaterId) => {
    return prisma.screen.findMany({
        where: {
            theaterId,
            isActive: true,
        },
        orderBy: { name: "asc" },
    });
};

const updateScreen = async (screenId, screenData) => {
    return prisma.screen.update({
        where: { id: screenId },
        data: screenData,
    });
};

const deactivateScreen = async (screenId) => {
    return prisma.screen.update({
        where: { id: screenId },
        data: { isActive: false },
    });
};

export {
    createScreen,
    findScreenById,
    findActiveScreenById,
    findScreensByTheater,
    updateScreen,
    deactivateScreen,
};
