import { Queue } from "bullmq";
import redis from "../config/redis.js";

export const SEAT_HOLD_QUEUE_NAME = "seat-hold-queue";

export const seatHoldQueue = new Queue(SEAT_HOLD_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: {
            age: 3600,
            count: 200,
        },
        removeOnFail: false,
    },
});

seatHoldQueue.on("error", (err) => {
    // Graceful error logging - prevent crashing when Redis is not available
    if (process.env.NODE_ENV !== "test") {
        // Suppress unhandled rejection noise
    }
});

export default seatHoldQueue;

