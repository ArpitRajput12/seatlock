import { Queue } from "bullmq";
import redis from "../../config/redis.js";
import { QUEUE_NAME } from "../../constants/queue.constants.js";

const webhookRetryQueue = new Queue(QUEUE_NAME.WEBHOOK_RETRY, {
    connection: redis,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: {
            age: 86400,
            count: 500,
        },
        removeOnFail: false,
    },
});

webhookRetryQueue.on("error", () => {});

export default webhookRetryQueue;

