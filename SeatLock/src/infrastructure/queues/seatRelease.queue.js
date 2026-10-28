import { Queue } from "bullmq";
import redis from "../../config/redis.js";
import { QUEUE_NAME } from "../../constants/queue.constants.js";

const seatReleaseQueue = new Queue(
    QUEUE_NAME.SEAT_RELEASE,
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

seatReleaseQueue.on("error", () => {});

export default seatReleaseQueue;