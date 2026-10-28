import prisma from "../config/db.js";

const findWebhookEvent = async (provider, eventId) => {
    return prisma.webhookEvent.findUnique({
        where: {
            provider_eventId: {
                provider,
                eventId,
            },
        },
    });
};

const createWebhookEvent = async (eventData) => {
    return prisma.webhookEvent.create({
        data: eventData,
    });
};

const updateWebhookEvent = async (webhookEventId, data) => {
    return prisma.webhookEvent.update({
        where: {
            id: webhookEventId,
        },
        data,
    });
};

export {
    findWebhookEvent,
    createWebhookEvent,
    updateWebhookEvent,
};