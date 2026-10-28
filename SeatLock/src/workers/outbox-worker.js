import { Worker } from "bullmq";
import redis from "../config/redis.js";
import logger from "../config/logger.js";
import { OUTBOX_QUEUE_NAME, outboxQueue } from "../queues/outbox-queue.js";
import { processOutboxEventsBatchService } from "../services/outboxProcessor.service.js";

let outboxWorker = null;

export const startOutboxWorker = async () => {
    if (outboxWorker) return outboxWorker;

    try {
        outboxWorker = new Worker(
            OUTBOX_QUEUE_NAME,
            async (job) => {
                const result = await processOutboxEventsBatchService(job.data?.batchSize || 50);
                return result;
            },
            {
                connection: redis,
                concurrency: 2,
            }
        );

        outboxWorker.on("completed", (job, returnvalue) => {
            if (returnvalue?.processedCount > 0) {
                logger.info({ processed: returnvalue.processedCount }, "[Outbox Worker] Events published");
            }
        });

        outboxWorker.on("failed", (job, err) => {
            logger.warn({ jobId: job?.id, error: err.message }, "[Outbox Worker] Job failed");
        });

        outboxWorker.on("error", (err) => {
            // Graceful error logging
            logger.debug({ err: err.message }, "[Outbox Worker] Redis event");
        });

        // Add 30-second recurring job
        try {
            await outboxQueue.add(
                "process-outbox-batch",
                {},
                {
                    repeat: { every: 30000 },
                    jobId: "process-outbox-recurring",
                    removeOnComplete: true,
                }
            );
        } catch (addErr) {
            logger.debug({ err: addErr.message }, "[Outbox Worker] Repeatable registration note");
        }

        logger.info("[Outbox Worker] Initialized and monitoring outbox events");
        return outboxWorker;
    } catch (err) {
        logger.warn({ err: err.message }, "[Outbox Worker] Could not initialize BullMQ worker");
        return null;
    }
};

export const stopOutboxWorker = async () => {
    if (outboxWorker) {
        await outboxWorker.close();
        outboxWorker = null;
    }
};

export default {
    startOutboxWorker,
    stopOutboxWorker,
};

