import { Worker } from "bullmq";
import redis from "../config/redis.js";
import logger from "../config/logger.js";
import { QUEUE_NAME, JOB_NAME } from "../constants/queue.constants.js";
import { releaseExpiredBookingSeats } from "../services/seatRelease.service.js";
import { recordFailedJob } from "../services/failedJobs.service.js";

let seatReleaseWorker = null;

const startSeatReleaseWorker = () => {
    if (seatReleaseWorker) return seatReleaseWorker;

    try {
        seatReleaseWorker = new Worker(
            QUEUE_NAME.SEAT_RELEASE,
            async (job) => {
                if (job.name !== JOB_NAME.RELEASE_EXPIRED_SEATS) {
                    throw new Error(`Unknown job name: ${job.name}`);
                }

                const { bookingId } = job.data;
                logger.info({ bookingId }, "[Seat Release Worker] Evaluating booking expiration");

                const result = await releaseExpiredBookingSeats(bookingId);

                if (result.released) {
                    logger.info({ bookingId }, "[Seat Release Worker] Seats released for booking");
                } else {
                    logger.info(
                        { bookingId, reason: result.reason },
                        "[Seat Release Worker] No release required"
                    );
                }

                return result;
            },
            {
                connection: redis,
                concurrency: 10,
            }
        );

        seatReleaseWorker.on("completed", (job) => {
            logger.info({ jobId: job.id }, "[Seat Release Worker] Job completed");
        });

        seatReleaseWorker.on("failed", async (job, error) => {
            logger.error(
                { jobId: job?.id, error: error.message },
                "[Seat Release Worker] Job failed"
            );

            if (job && job.attemptsMade >= (job.opts?.attempts || 5)) {
                await recordFailedJob({
                    queueName: QUEUE_NAME.SEAT_RELEASE,
                    jobId: job.id,
                    jobName: job.name,
                    payload: job.data,
                    error: error.message,
                    attempts: job.attemptsMade,
                });
            }
        });

        seatReleaseWorker.on("error", () => {});

        logger.info("[Seat Release Worker] Started");
        return seatReleaseWorker;
    } catch (err) {
        logger.warn({ error: err.message }, "[Seat Release Worker] Initialization skipped");
        return null;
    }
};

const stopSeatReleaseWorker = async () => {
    if (seatReleaseWorker) {
        logger.info("[Seat Release Worker] Closing...");
        await seatReleaseWorker.close();
        seatReleaseWorker = null;
        logger.info("[Seat Release Worker] Closed");
    }
};

export {
    seatReleaseWorker,
    startSeatReleaseWorker,
    stopSeatReleaseWorker,
};
