import prisma from "../config/db.js";
import redis from "../config/redis.js";
import logger from "../config/logger.js";
import registerProcessErrorHandlers from "../utils/processLogger.js";

import {
    startOutboxWorker,
    stopOutboxWorker,
} from "./outbox.worker.js";

import {
    startSeatReleaseWorker,
    stopSeatReleaseWorker,
} from "./seatRelease.worker.js";

import {
    startHoldExpireWorker,
    stopHoldExpireWorker,
} from "./holdExpire.worker.js";

import {
    startWebhookRetryWorker,
    stopWebhookRetryWorker,
} from "./webhookRetry.worker.js";

import {
    startOutboxPublishWorker,
    stopOutboxPublishWorker,
} from "./outboxPublish.worker.js";

import {
    startOutboxDispatcher,
    stopOutboxDispatcher,
} from "./outbox.dispatcher.js";

const startWorkers = async () => {
    try {
        await prisma.$connect();
        logger.info("[Worker Runner] PostgreSQL connected");

        try {
            await redis.ping();
            logger.info("[Worker Runner] Redis connected");
        } catch (redisErr) {
            logger.warn({ error: redisErr.message }, "[Worker Runner] Redis is not reachable. Workers paused gracefully.");
            return;
        }

        startOutboxWorker();
        startSeatReleaseWorker();
        await startHoldExpireWorker();
        startWebhookRetryWorker();
        startOutboxPublishWorker();
        startOutboxDispatcher();

        logger.info("[Worker Runner] All background workers and dispatchers running");

        let isShuttingDown = false;
        const shutdown = async (signal) => {
            if (isShuttingDown) return;
            isShuttingDown = true;
            logger.info(`[Worker Runner] ${signal} received. Stopping workers...`);

            try {
                stopOutboxDispatcher();
                await Promise.allSettled([
                    stopOutboxWorker(),
                    stopSeatReleaseWorker(),
                    stopHoldExpireWorker(),
                    stopWebhookRetryWorker(),
                    stopOutboxPublishWorker(),
                ]);
                await redis.quit();
                await prisma.$disconnect();
                logger.info("[Worker Runner] All workers cleanly stopped");
                process.exit(0);
            } catch (err) {
                logger.error({ err }, "[Worker Runner] Error stopping workers");
                process.exit(1);
            }
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        logger.error({ error }, "[Worker Runner] Startup failed");
        process.exit(1);
    }
};

registerProcessErrorHandlers();
startWorkers();

