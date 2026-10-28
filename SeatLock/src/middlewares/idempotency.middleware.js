import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import {
    findIdempotencyKey,
    createIdempotencyKey,
} from "../repositories/idempotency.repository.js";

/**
 * Creates an idempotency handler with configurable requirement options.
 * Can be used directly as a middleware (defaults to required: true) or as a factory:
 * idempotencyMiddleware({ required: false })
 */
const createIdempotencyHandler = (options = { required: true }) => {
    return async (req, res, next) => {
        const key = req.headers["idempotency-key"];

        if (!key) {
            if (options.required) {
                throw new AppError(
                    "Idempotency-Key header is required",
                    HTTP_STATUS.BAD_REQUEST
                );
            }
            return next();
        }

        if (
            typeof key !== "string" ||
            key.length < 5 ||
            key.length > 255
        ) {
            throw new AppError(
                "Invalid Idempotency-Key",
                HTTP_STATUS.BAD_REQUEST
            );
        }

        if (!req.user || !req.user.id) {
            throw new AppError(
                "Authentication required for idempotent requests",
                HTTP_STATUS.UNAUTHORIZED
            );
        }

        const userId = req.user.id;

        const requestHash = JSON.stringify({
            method: req.method,
            path: req.baseUrl + req.path,
            body: req.validated?.body || req.body || {},
        });

        const existingKey = await findIdempotencyKey(
            userId,
            key
        );

        if (existingKey) {
            // Check expiry
            if (
                existingKey.expiresAt &&
                existingKey.expiresAt <= new Date()
            ) {
                req.idempotencyKey = key;
                req.idempotencyRecordId = existingKey.id;
                return next();
            }

            // Same key + different request
            if (existingKey.requestHash !== requestHash) {
                throw new AppError(
                    "Idempotency-Key cannot be reused with a different request",
                    HTTP_STATUS.CONFLICT
                );
            }

            // Stored response
            if (existingKey.responseBody) {
                return res
                    .status(
                        existingKey.statusCode ||
                        HTTP_STATUS.OK
                    )
                    .json(existingKey.responseBody);
            }

            // Request currently in progress
            throw new AppError(
                "Request with this Idempotency-Key is already being processed",
                HTTP_STATUS.CONFLICT
            );
        }

        // Create idempotency record
        try {
            const idempotencyRecord = await createIdempotencyKey({
                userId,
                key,
                requestHash,
                expiresAt: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ),
            });

            req.idempotencyKey = key;
            req.idempotencyRecordId = idempotencyRecord.id;

            return next();
        } catch (error) {
            if (error.code === "P2002") {
                throw new AppError(
                    "Request with this Idempotency-Key is already being processed",
                    HTTP_STATUS.CONFLICT
                );
            }

            throw error;
        }
    };
};

const idempotencyMiddleware = (reqOrOptions, res, next) => {
    // If called as middleware directly: (req, res, next)
    if (res && typeof next === "function") {
        return createIdempotencyHandler({ required: true })(
            reqOrOptions,
            res,
            next
        );
    }

    // If called as a factory: idempotencyMiddleware({ required: false })
    return createIdempotencyHandler(reqOrOptions);
};

export default idempotencyMiddleware;
export { idempotencyMiddleware, createIdempotencyHandler };