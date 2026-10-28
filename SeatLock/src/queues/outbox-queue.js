import { Queue } from "bullmq";
import redis from "../config/redis.js";

export const OUTBOX_QUEUE_NAME = "outbox-queue";

export const outboxQueue = new Queue(OUTBOX_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: {
            age: 3600,
            count: 500,
        },
        removeOnFail: false,
    },
});

outboxQueue.on("error", () => {
    // Graceful error logging
});

export default outboxQueue;

