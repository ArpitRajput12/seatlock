import Redlock from "redlock";
import redis from "../config/redis.js";

const redlock = new Redlock(
    [redis],
    {
        driftFactor: 0.01,
        retryCount: 3,
        retryDelay: 200,
        retryJitter: 100,
        automaticExtensionThreshold: 500,
    }
);

redlock.on("error", (error) => {
    console.error("Redlock error:", error);
});

export default redlock;