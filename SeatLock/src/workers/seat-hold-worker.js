import { Worker } from "bullmq";
import redis from "../config/redis.js";
import logger from "../config/logger.js";
import { SEAT_HOLD_QUEUE_NAME, seatHoldQueue } from "../queues/seat-hold-queue.js";
import { scanAndExpireHoldsService } from "../services/holdExpire.service.js";

let seatHoldWorker = null;

export const startSeatHoldWorker = async () => {
    if (seatHoldWorker) return seatHoldWorker;

    try {
        seatHoldWorker = new Worker(
            SEAT_HOLD_QUEUE_NAME,
            async (job) => {
                logger.info({ jobId: job.id, jobName: job.name }, "[Seat Hold Worker] Scanning for expired seat holds...");
                const result = await scanAndExpireHoldsService();
                if (result?.expiredSeatsCount > 0) {
                    logger.info(
                        {
                            expiredSeatsCount: result.expiredSeatsCount,
                            cancelledBookingsCount: result.cancelledBookingsCount,
                        },
                        "[Seat Hold Worker] Expired seats released back to AVAILABLE"
                    );
                }
                return result;
            },
            {
                connection: redis,
                concurrency: 1,
            }
        );

        seatHoldWorker.on("completed", (job, returnvalue) => {
            if (returnvalue?.expiredSeatsCount > 0) {
                logger.info({ jobId: job.id, returnvalue }, "[Seat Hold Worker] Batch completed");
            }
        });

        seatHoldWorker.on("failed", (job, err) => {
            logger.warn({ jobId: job?.id, error: err.message }, "[Seat Hold Worker] Job execution failed");
        });

        seatHoldWorker.on("error", (err) => {
            // Graceful reconnection handling - do not crash Express
            logger.debug({ err: err.message }, "[Seat Hold Worker] Redis connection event");
        });

        // Add 1-minute recurring job to scan and release 10-minute holds
        try {
            await seatHoldQueue.add(
                "scan-expired-holds",
                {},
                {
                    repeat: { every: 60000 },
                    jobId: "scan-expired-holds-recurring",
                    removeOnComplete: true,
                }
            );
        } catch (addErr) {
            logger.debug({ err: addErr.message }, "[Seat Hold Worker] Repeatable registration note");
        }

        logger.info("[Seat Hold Worker] Initialized and monitoring hold expirations");
        return seatHoldWorker;
    } catch (err) {
        logger.warn({ err: err.message }, "[Seat Hold Worker] Could not initialize BullMQ worker (operating in fallback mode)");
        return null;
    }
};

export const stopSeatHoldWorker = async () => {
    if (seatHoldWorker) {
        await seatHoldWorker.close();
        seatHoldWorker = null;
    }
};

export default {
    startSeatHoldWorker,
    stopSeatHoldWorker,
};

