import prisma from "../config/db.js";
import logger from "../config/logger.js";
import { runBookingSaga } from "./sagaOrchestrator.service.js";

const retryWebhookEventService = async ({ webhookEventId }) => {
    const webhookEvent = await prisma.webhookEvent.findUnique({
        where: { id: webhookEventId },
    });

    if (!webhookEvent) {
        throw new Error(`WebhookEvent not found: ${webhookEventId}`);
    }

    if (webhookEvent.processed) {
        logger.info({ webhookEventId }, "Webhook event already processed");
        return { processed: true, duplicate: true };
    }

    try {
        const event = webhookEvent.payload;

        if (webhookEvent.provider === "STRIPE") {
            if (event.type === "payment_intent.succeeded") {
                const paymentIntent = event.data?.object;
                if (paymentIntent) {
                    const payment = await prisma.payment.findFirst({
                        where: { stripePaymentIntentId: paymentIntent.id },
                        include: { booking: true },
                    });

                    if (payment) {
                        await prisma.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: "SUCCEEDED",
                                paidAt: new Date(),
                                stripeChargeId: paymentIntent.latest_charge || null,
                            },
                        });

                        // Run Saga orchestrator
                        await runBookingSaga({
                            userId: payment.booking.userId,
                            bookingId: payment.bookingId,
                        });
                    }
                }
            }
        }

        await prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
                processed: true,
                processedAt: new Date(),
                errorMessage: null,
            },
        });

        logger.info({ webhookEventId }, "Webhook event retry succeeded");

        return { processed: true, eventId: webhookEventId };
    } catch (error) {
        await prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
                errorMessage: error.message,
            },
        });

        logger.error({ webhookEventId, error: error.message }, "Webhook event retry attempt failed");
        throw error;
    }
};

export {
    retryWebhookEventService,
};

