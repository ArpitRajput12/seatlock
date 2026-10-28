import { Worker } from "bullmq";
import redis from "../config/redis.js";
import logger from "../config/logger.js";
import { QUEUE_NAME, JOB_NAME } from "../constants/queue.constants.js";
import { processOutboxEvent } from "../services/outboxProcessor.service.js";
import { recordFailedJob } from "../services/failedJobs.service.js";

let outboxWorker = null;

const startOutboxWorker = () => {
    if (outboxWorker) return outboxWorker;

    try {
        outboxWorker = new Worker(
            QUEUE_NAME.OUTBOX,
            async (job) => {
                if (job.name !== JOB_NAME.PROCESS_OUTBOX_EVENT) {
                    throw new Error(`Unknown job name: ${job.name}`);
                }

                logger.info({ jobId: job.id }, "[Outbox Worker] Processing job");
                const result = await processOutboxEvent(job.data.outboxEventId);
                logger.info({ jobId: job.id }, "[Outbox Worker] Completed job");
                return result;
            },
            {
                connection: redis,
                concurrency: 5,
                stalledInterval: 30000,
            }
        );

        outboxWorker.on("completed", (job) => {
            logger.info({ jobId: job.id }, "[Outbox Worker] Job completed");
        });

        outboxWorker.on("failed", async (job, error) => {
            logger.error({ jobId: job?.id, error: error.message }, "[Outbox Worker] Job failed");

            if (job && job.attemptsMade >= (job.opts?.attempts || 5)) {
                await recordFailedJob({
                    queueName: QUEUE_NAME.OUTBOX,
                    jobId: job.id,
                    jobName: job.name,
                    payload: job.data,
                    error: error.message,
                    attempts: job.attemptsMade,
                });
            }
        });

        outboxWorker.on("error", () => {});

        logger.info("[Outbox Worker] Started");
        return outboxWorker;
    } catch (err) {
        logger.warn({ error: err.message }, "[Outbox Worker] Initialization skipped");
        return null;
    }
};

const stopOutboxWorker = async () => {
    if (outboxWorker) {
        logger.info("[Outbox Worker] Closing...");
        await outboxWorker.close();
        outboxWorker = null;
        logger.info("[Outbox Worker] Closed");
    }
};

export {
    outboxWorker,
    startOutboxWorker,
    stopOutboxWorker,
};

export default outboxWorker;
