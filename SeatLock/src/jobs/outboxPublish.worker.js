import { Worker } from "bullmq";
import redis from "../config/redis.js";
import logger from "../config/logger.js";
import { QUEUE_NAME, JOB_NAME } from "../constants/queue.constants.js";
import { sendNotificationService } from "../services/notification.service.js";
import { recordFailedJob } from "../services/failedJobs.service.js";

let outboxPublishWorker = null;

const startOutboxPublishWorker = () => {
    if (outboxPublishWorker) return outboxPublishWorker;

    try {
        outboxPublishWorker = new Worker(
            QUEUE_NAME.OUTBOX_PUBLISH,
            async (job) => {
                if (job.name !== JOB_NAME.PUBLISH_NOTIFICATION) {
                    throw new Error(`Unknown job name: ${job.name}`);
                }

                logger.info(
                    { jobId: job.id, eventType: job.data?.eventType, aggregateId: job.data?.aggregateId },
                    "[Outbox Publish Worker] Processing notification dispatch"
                );

                const result = await sendNotificationService(job.data);
                return result;
            },
            {
                connection: redis,
                concurrency: 5,
            }
        );

        outboxPublishWorker.on("completed", (job) => {
            logger.info({ jobId: job.id }, "[Outbox Publish Worker] Notification dispatched successfully");
        });

        outboxPublishWorker.on("failed", async (job, error) => {
            logger.error(
                { jobId: job?.id, attempts: job?.attemptsMade, error: error.message },
                "[Outbox Publish Worker] Notification dispatch attempt failed"
            );

            if (job && job.attemptsMade >= (job.opts?.attempts || 5)) {
                logger.error(
                    { jobId: job.id, error: error.message },
                    "[Outbox Publish Worker] Notification exhausted all attempts. Recording in failed_jobs table."
                );

                await recordFailedJob({
                    queueName: QUEUE_NAME.OUTBOX_PUBLISH,
                    jobId: job.id,
                    jobName: job.name,
                    payload: job.data,
                    error: error.message,
                    attempts: job.attemptsMade,
                });
            }
        });

        outboxPublishWorker.on("error", () => {
            // Silently suppress reconnect errors if offline
        });

        logger.info("[Outbox Publish Worker] Started");
        return outboxPublishWorker;
    } catch (err) {
        logger.warn({ error: err.message }, "[Outbox Publish Worker] Initialization skipped");
        return null;
    }
};

const stopOutboxPublishWorker = async () => {
    if (outboxPublishWorker) {
        logger.info("[Outbox Publish Worker] Closing...");
        await outboxPublishWorker.close();
        outboxPublishWorker = null;
        logger.info("[Outbox Publish Worker] Closed");
    }
};

export {
    outboxPublishWorker,
    startOutboxPublishWorker,
    stopOutboxPublishWorker,
};
