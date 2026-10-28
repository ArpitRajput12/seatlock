import { Worker } from "bullmq";
import redis from "../config/redis.js";
import logger from "../config/logger.js";
import { QUEUE_NAME, JOB_NAME } from "../constants/queue.constants.js";
import { retryWebhookEventService } from "../services/webhookRetry.service.js";
import { recordFailedJob } from "../services/failedJobs.service.js";

let webhookRetryWorker = null;

const startWebhookRetryWorker = () => {
    if (webhookRetryWorker) return webhookRetryWorker;

    try {
        webhookRetryWorker = new Worker(
            QUEUE_NAME.WEBHOOK_RETRY,
            async (job) => {
                if (job.name !== JOB_NAME.RETRY_WEBHOOK) {
                    throw new Error(`Unknown job name: ${job.name}`);
                }

                logger.info({ jobId: job.id, data: job.data }, "[Webhook Retry Worker] Processing job");
                const result = await retryWebhookEventService(job.data);
                return result;
            },
            {
                connection: redis,
                concurrency: 5,
            }
        );

        webhookRetryWorker.on("completed", (job) => {
            logger.info({ jobId: job.id }, "[Webhook Retry Worker] Job completed");
        });

        webhookRetryWorker.on("failed", async (job, error) => {
            logger.error(
                { jobId: job?.id, attempts: job?.attemptsMade, error: error.message },
                "[Webhook Retry Worker] Job attempt failed"
            );

            if (job && job.attemptsMade >= (job.opts?.attempts || 5)) {
                logger.error(
                    { jobId: job.id, error: error.message },
                    "[Webhook Retry Worker] Job exhausted all attempts. Recording in failed_jobs table."
                );

                await recordFailedJob({
                    queueName: QUEUE_NAME.WEBHOOK_RETRY,
                    jobId: job.id,
                    jobName: job.name,
                    payload: job.data,
                    error: error.message,
                    attempts: job.attemptsMade,
                });
            }
        });

        webhookRetryWorker.on("error", () => {
            // Silently suppress reconnect errors if offline
        });

        logger.info("[Webhook Retry Worker] Started");
        return webhookRetryWorker;
    } catch (err) {
        logger.warn({ error: err.message }, "[Webhook Retry Worker] Initialization skipped");
        return null;
    }
};

const stopWebhookRetryWorker = async () => {
    if (webhookRetryWorker) {
        logger.info("[Webhook Retry Worker] Closing...");
        await webhookRetryWorker.close();
        webhookRetryWorker = null;
        logger.info("[Webhook Retry Worker] Closed");
    }
};

export {
    webhookRetryWorker,
    startWebhookRetryWorker,
    stopWebhookRetryWorker,
};
