import logger from "../config/logger.js";
import {
    findOutboxEventById,
    markOutboxEventProcessed,
    markOutboxEventFailed,
} from "../repositories/outbox.repository.js";
import { OUTBOX_EVENT } from "../constants/outbox.constants.js";
import seatReleaseQueue from "../infrastructure/queues/seatRelease.queue.js";
import outboxPublishQueue from "../infrastructure/queues/outboxPublish.queue.js";
import { JOB_NAME } from "../constants/queue.constants.js";

/**
 * Processes an individual transactional outbox event.
 * Dispatches domain jobs (e.g. BullMQ seat release timers or notifications)
 * and safely updates outbox event states to prevent split-brain delivery.
 */
const processOutboxEvent = async (outboxEventId) => {
    const event = await findOutboxEventById(outboxEventId);

    if (!event) {
        throw new Error(`Outbox event not found: ${outboxEventId}`);
    }

    if (event.status === "PROCESSED") {
        return {
            processed: true,
            duplicate: true,
            eventId: event.id,
        };
    }

    try {
        switch (event.eventType) {
            case OUTBOX_EVENT.BOOKING_CREATED:
            case OUTBOX_EVENT.SEATS_HELD:
                logger.info({ eventId: event.id, type: event.eventType, aggregateId: event.aggregateId }, "Processing outbox event");
                break;

            case OUTBOX_EVENT.SEAT_RELEASE_SCHEDULED: {
                const { bookingId, holdExpiresAt } = event.payload || {};

                if (!bookingId) {
                    throw new Error("bookingId missing from SEAT_RELEASE_SCHEDULED event");
                }

                const expiryTime = new Date(holdExpiresAt).getTime();
                if (Number.isNaN(expiryTime)) {
                    throw new Error("Invalid holdExpiresAt in SEAT_RELEASE_SCHEDULED event");
                }

                const delay = Math.max(0, expiryTime - Date.now());

                await seatReleaseQueue.add(
                    JOB_NAME.RELEASE_EXPIRED_SEATS,
                    { bookingId },
                    {
                        jobId: `release-${bookingId}`,
                        delay,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                logger.info(
                    { bookingId, delayMs: delay },
                    "[Outbox Worker] Delayed seat release timer scheduled"
                );
                break;
            }

            case OUTBOX_EVENT.PAYMENT_SUCCEEDED:
            case OUTBOX_EVENT.PAYMENT_FAILED:
            case OUTBOX_EVENT.BOOKING_CONFIRMED:
            case OUTBOX_EVENT.BOOKING_CANCELLED:
            case OUTBOX_EVENT.SEATS_RELEASED:
            case OUTBOX_EVENT.REFUND_CREATED:
                logger.info({ eventId: event.id, type: event.eventType, aggregateId: event.aggregateId }, "Processing outbox event");
                break;

            default:
                throw new Error(`Unknown outbox event type: ${event.eventType}`);
        }

        // Dispatch async customer notification if applicable
        const notificationEvents = [
            OUTBOX_EVENT.BOOKING_CREATED,
            OUTBOX_EVENT.BOOKING_CONFIRMED,
            OUTBOX_EVENT.BOOKING_CANCELLED,
            OUTBOX_EVENT.PAYMENT_SUCCEEDED,
            OUTBOX_EVENT.PAYMENT_FAILED,
            OUTBOX_EVENT.REFUND_CREATED,
        ];

        if (notificationEvents.includes(event.eventType)) {
            await outboxPublishQueue.add(
                JOB_NAME.PUBLISH_NOTIFICATION,
                {
                    outboxEventId: event.id,
                    eventType: event.eventType,
                    aggregateType: event.aggregateType,
                    aggregateId: event.aggregateId,
                    payload: event.payload,
                },
                {
                    jobId: `publish-${event.id}`,
                }
            );
        }

        await markOutboxEventProcessed(event.id);

        return {
            processed: true,
            eventId: event.id,
            eventType: event.eventType,
        };
    } catch (error) {
        await markOutboxEventFailed(
            event.id,
            error.message,
            new Date(Date.now() + 5000)
        );
        throw error;
    }
};

export {
    processOutboxEvent,
};
