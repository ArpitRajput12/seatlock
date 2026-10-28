import redis from "../config/redis.js";

const DEFAULT_TTL_SECONDS = 60;

// --------------------------------------------------
// GET CACHE
// --------------------------------------------------
const getCache = async (key) => {
    try {
        const value = await redis.get(key);
        if (!value) {
            return null;
        }
        return JSON.parse(value);
    } catch {
        return null;
    }
};

// --------------------------------------------------
// SET CACHE
// --------------------------------------------------
const setCache = async (
    key,
    value,
    ttlSeconds = DEFAULT_TTL_SECONDS
) => {
    try {
        await redis.set(
            key,
            JSON.stringify(value),
            "EX",
            ttlSeconds
        );
        return true;
    } catch {
        return false;
    }
};

// --------------------------------------------------
// DELETE CACHE
// --------------------------------------------------
const deleteCache = async (key) => {
    try {
        await redis.del(key);
        return true;
    } catch {
        return false;
    }
};

// --------------------------------------------------
// DELETE CACHE BY PATTERN
// --------------------------------------------------
const deleteCacheByPattern = async (pattern) => {
    try {
        let cursor = "0";
        let deletedCount = 0;

        do {
            const result = await redis.scan(
                cursor,
                "MATCH",
                pattern,
                "COUNT",
                100
            );

            cursor = result[0];
            const keys = result[1];

            if (keys && keys.length > 0) {
                deletedCount += await redis.del(...keys);
            }
        } while (cursor !== "0");

        return deletedCount;
    } catch {
        return 0;
    }
};

// --------------------------------------------------
// CACHE ASIDE + RESILIENT DB FALLBACK
// --------------------------------------------------
const getOrSetCache = async (
    key,
    loader,
    ttlSeconds = DEFAULT_TTL_SECONDS
) => {
    try {
        // 1. Check Redis first
        const cached = await getCache(key);
        if (cached !== null) {
            return {
                data: cached,
                source: "cache",
            };
        }

        // 2. Try acquiring distributed lock
        const lockKey = `cache-lock:${key}`;
        const lockToken = `${Date.now()}-${Math.random()}`;

        const lockAcquired = await redis.set(
            lockKey,
            lockToken,
            "PX",
            5000,
            "NX"
        ).catch(() => null);

        if (lockAcquired) {
            try {
                const secondCheck = await getCache(key);
                if (secondCheck !== null) {
                    return {
                        data: secondCheck,
                        source: "cache",
                    };
                }

                const data = await loader();
                if (data !== null && data !== undefined) {
                    await setCache(key, data, ttlSeconds);
                }
                return {
                    data,
                    source: "database",
                };
            } finally {
                const releaseScript = `
                    if redis.call("GET", KEYS[1]) == ARGV[1]
                    then
                        return redis.call("DEL", KEYS[1])
                    else
                        return 0
                    end
                `;
                await redis.eval(releaseScript, 1, lockKey, lockToken).catch(() => null);
            }
        }
    } catch {
        // Fall through to database loader if Redis is down or times out
    }

    // --------------------------------------------------
    // Resilient Fallback to PostgreSQL
    // --------------------------------------------------
    const data = await loader();

    if (data !== null && data !== undefined) {
        await setCache(key, data, ttlSeconds).catch(() => null);
    }

    return {
        data,
        source: "database",
    };
};

export {
    getCache,
    setCache,
    deleteCache,
    deleteCacheByPattern,
    getOrSetCache,
};
