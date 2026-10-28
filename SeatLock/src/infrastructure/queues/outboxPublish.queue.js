import { Queue } from "bullmq";
import redis from "../../config/redis.js";
import { QUEUE_NAME } from "../../constants/queue.constants.js";

const outboxPublishQueue = new Queue(QUEUE_NAME.OUTBOX_PUBLISH, {
    connection: redis,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
        removeOnComplete: {
            age: 86400,
            count: 1000,
        },
        removeOnFail: false,
    },
});

outboxPublishQueue.on("error", () => {});

export default outboxPublishQueue;

