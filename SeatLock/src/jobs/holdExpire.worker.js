import { Worker } from "bullmq";
import redis from "../config/redis.js";
import logger from "../config/logger.js";
import { QUEUE_NAME, JOB_NAME } from "../constants/queue.constants.js";
import holdExpireQueue from "../infrastructure/queues/holdExpire.queue.js";
import { scanAndExpireHoldsService } from "../services/holdExpire.service.js";
import { recordFailedJob } from "../services/failedJobs.service.js";

let holdExpireWorker = null;

const startHoldExpireWorker = async () => {
    if (holdExpireWorker) return holdExpireWorker;

    try {
        holdExpireWorker = new Worker(
            QUEUE_NAME.HOLD_EXPIRE,
            async (job) => {
                if (job.name !== JOB_NAME.SCAN_EXPIRED_HOLDS) {
                    throw new Error(`Unknown job name: ${job.name}`);
                }

                const result = await scanAndExpireHoldsService();
                return result;
            },
            {
                connection: redis,
                concurrency: 1,
            }
        );

        holdExpireWorker.on("completed", (job, returnvalue) => {
            if (returnvalue?.expiredSeatsCount > 0) {
                logger.info(
                    {
                        jobId: job.id,
                        expiredSeats: returnvalue.expiredSeatsCount,
                        cancelledBookings: returnvalue.cancelledBookingsCount,
                    },
                    "[Hold Expire Worker] Reclaimed expired seats"
                );
            }
        });

        holdExpireWorker.on("failed", async (job, error) => {
            logger.error(
                { jobId: job?.id, error: error.message },
                "[Hold Expire Worker] Job failed"
            );

            if (job) {
                await recordFailedJob({
                    queueName: QUEUE_NAME.HOLD_EXPIRE,
                    jobId: job.id,
                    jobName: job.name,
                    payload: job.data,
                    error: error.message,
                    attempts: job.attemptsMade,
                });
            }
        });

        holdExpireWorker.on("error", () => {
            // Silently suppress Redis reconnect errors if offline
        });

        logger.info("[Hold Expire Worker] Started");

        // Add repeatable job running every 1 minute
        try {
            await holdExpireQueue.add(
                JOB_NAME.SCAN_EXPIRED_HOLDS,
                {},
                {
                    repeat: {
                        every: 60000,
                    },
                    jobId: "scan-expired-holds-recurring",
                    removeOnComplete: true,
                }
            );
        } catch (err) {
            logger.warn({ err: err.message }, "[Hold Expire Worker] Repeatable job registration note");
        }

        return holdExpireWorker;
    } catch (err) {
        logger.warn({ error: err.message }, "[Hold Expire Worker] Initialization skipped");
        return null;
    }
};

const stopHoldExpireWorker = async () => {
    if (holdExpireWorker) {
        logger.info("[Hold Expire Worker] Closing...");
        await holdExpireWorker.close();
        holdExpireWorker = null;
        logger.info("[Hold Expire Worker] Closed");
    }
};

export {
    holdExpireWorker,
    startHoldExpireWorker,
    stopHoldExpireWorker,
};
