import { HTTP_STATUS } from "../constants/httpStatus.js";
import { consumeToken } from "../services/rateLimit.service.js";
import AppError from "../utils/AppError.js";

const rateLimitMiddleware = (config) => {
    return async (req, res, next) => {
        try {
            const capacity = config.capacity ?? config.CAPACITY;
            const refillRate = config.refillRate ?? config.REFILL_RATE;
            const windowSeconds =
                config.windowSeconds ?? config.WINDOW_SECONDS;

            const keyPrefix =
                config.keyPrefix || "general";

            const identifier =
                req.user?.id || req.ip;

            const key =
                `${keyPrefix}:${identifier}`;

            const result = await consumeToken({
                key,
                capacity,
                refillRate,
                windowSeconds,
            });

            res.setHeader(
                "X-RateLimit-Limit",
                capacity
            );

            res.setHeader(
                "X-RateLimit-Remaining",
                result.remaining
            );

            if (!result.allowed) {
                res.setHeader(
                    "Retry-After",
                    result.retryAfter
                );

                throw new AppError(
                    "Too many requests. Please try again later.",
                    HTTP_STATUS.TOO_MANY_REQUESTS
                );
            }

            next();
        } catch (error) {
            if (error instanceof AppError) {
                return next(error);
            }
            // In case of Redis outage or local dev without Redis, gracefully proceed
            next();
        }
    };
};

export default rateLimitMiddleware;
