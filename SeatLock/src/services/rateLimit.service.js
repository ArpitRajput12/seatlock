import redis from "../config/redis.js";

const consumeToken = async ({
    key,
    capacity,
    refillRate,
    windowSeconds,
}) => {
    // --------------------------------------------------
    // Validate configuration before sending to Redis
    // --------------------------------------------------

    const parsedCapacity = Number(capacity);
    const parsedRefillRate = Number(refillRate);
    const parsedWindowSeconds = Number(windowSeconds);

    if (
        !Number.isFinite(parsedCapacity) ||
        parsedCapacity <= 0
    ) {
        throw new Error(
            `Invalid rate limit capacity: ${capacity}`
        );
    }

    if (
        !Number.isFinite(parsedRefillRate) ||
        parsedRefillRate <= 0
    ) {
        throw new Error(
            `Invalid rate limit refillRate: ${refillRate}`
        );
    }

    if (
        !Number.isFinite(parsedWindowSeconds) ||
        parsedWindowSeconds <= 0
    ) {
        throw new Error(
            `Invalid rate limit windowSeconds: ${windowSeconds}`
        );
    }

    const now = Date.now();
    const redisKey = `rate-limit:${key}`;
    const windowMs = parsedWindowSeconds * 1000;

    const script = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local windowMs = tonumber(ARGV[4])

        if capacity == nil then
            return redis.error_reply("Invalid capacity")
        end
        if refillRate == nil then
            return redis.error_reply("Invalid refillRate")
        end
        if now == nil then
            return redis.error_reply("Invalid now")
        end
        if windowMs == nil then
            return redis.error_reply("Invalid windowMs")
        end

        local data = redis.call("HMGET", key, "tokens", "timestamp")
        local tokens = tonumber(data[1])
        local timestamp = tonumber(data[2])

        if tokens == nil then
            tokens = capacity
            timestamp = now
        end

        local elapsed = math.max(0, now - timestamp)
        local refill = (elapsed / windowMs) * refillRate
        tokens = math.min(capacity, tokens + refill)

        local allowed = 0
        local retryAfter = 0

        if tokens >= 1 then
            tokens = tokens - 1
            allowed = 1
        else
            local missingTokens = 1 - tokens
            retryAfter = math.ceil((missingTokens / refillRate) * windowMs / 1000)
        end

        redis.call("HSET", key, "tokens", tokens, "timestamp", now)
        redis.call("EXPIRE", key, math.ceil(windowMs / 1000) * 2)

        return {
            allowed,
            math.floor(tokens),
            retryAfter
        }
    `;

    try {
        const result = await redis.eval(
            script,
            1,
            redisKey,
            parsedCapacity,
            parsedRefillRate,
            now,
            windowMs
        );

        return {
            allowed: Number(result[0]) === 1,
            remaining: Number(result[1]),
            retryAfter: Number(result[2]),
        };
    } catch {
        // Resilient fail-open if Redis is unreachable
        return {
            allowed: true,
            remaining: parsedCapacity,
            retryAfter: 0,
        };
    }
};

export {
    consumeToken,
};
