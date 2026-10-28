import Redis from "ioredis";
import env from "./env.js";
import logger from "./logger.js";

let hasWarnedOffline = false;

const redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 2000,
    retryStrategy(times) {
        if (times > 3) {
            if (!hasWarnedOffline) {
                logger.warn("[Redis] Stopped reconnect attempts. Background queues paused.");
                hasWarnedOffline = true;
            }
            return null;
        }
        return Math.min(times * 200, 2000);
    },
});

redis.on("connect", () => {
    logger.info("Redis connected successfully");
    hasWarnedOffline = false;
});

redis.on("error", (err) => {
    if (!hasWarnedOffline) {
        logger.warn(
            { error: err.message },
            "[Redis Warning] Redis is not reachable, running in offline/graceful mode"
        );
        hasWarnedOffline = true;
    }
});

export default redis;
