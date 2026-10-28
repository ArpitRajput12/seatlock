import { Queue } from "bullmq";
import redis from "../../config/redis.js";
import { QUEUE_NAME } from "../../constants/queue.constants.js";

const holdExpireQueue = new Queue(QUEUE_NAME.HOLD_EXPIRE, {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: {
            age: 3600,
            count: 100,
        },
        removeOnFail: false,
    },
});

holdExpireQueue.on("error", () => {});

export default holdExpireQueue;

