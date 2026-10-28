import { Queue } from "bullmq";
import redis from "../../config/redis.js";
import { QUEUE_NAME } from "../../constants/queue.constants.js";

const outboxQueue = new Queue(
    QUEUE_NAME.OUTBOX,
    {
        connection: redis,

        defaultJobOptions: {
            attempts: 5,

            backoff: {
                type: "exponential",
                delay: 2000,
            },

            removeOnComplete: {
                age: 3600,
            },

            removeOnFail: false,
        },
    }
);

outboxQueue.on("error", () => {});

export default outboxQueue;