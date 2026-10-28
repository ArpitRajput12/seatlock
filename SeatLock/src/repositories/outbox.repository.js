import prisma from "../config/db.js";

const createOutboxEvent = async (db, eventData) => {
    return db.outboxEvent.create({
        data: eventData,
    });
};

const findOutboxEventById = async (eventId) => {
    return prisma.outboxEvent.findUnique({
        where: {
            id: eventId,
        },
    });
};

const findPendingOutboxEvents = async (limit = 100) => {
    return prisma.outboxEvent.findMany({
        where: {
            status: "PENDING",
            availableAt: {
                lte: new Date(),
            },
        },
        orderBy: {
            createdAt: "asc",
        },
        take: limit,
    });
};

const markOutboxEventProcessing = async (eventId) => {
    return prisma.outboxEvent.updateMany({
        where: {
            id: eventId,
            status: "PENDING",
        },
        data: {
            status: "PROCESSING",
            attempts: {
                increment: 1,
            },
        },
    });
};

const markOutboxEventProcessed = async (eventId) => {
    return prisma.outboxEvent.update({
        where: {
            id: eventId,
        },
        data: {
            status: "PROCESSED",
            processedAt: new Date(),
        },
    });
};

const markOutboxEventFailed = async (
    eventId,
    errorMessage,
    availableAt
) => {
    return prisma.outboxEvent.update({
        where: {
            id: eventId,
        },

        data: {
            status: "PENDING",
            lastError: errorMessage,
            availableAt,
        },
    });
};

export {
    createOutboxEvent,
    findOutboxEventById,
    findPendingOutboxEvents,
    markOutboxEventProcessing,
    markOutboxEventProcessed,
    markOutboxEventFailed,
};