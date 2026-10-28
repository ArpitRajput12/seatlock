import app from "./app.js";

import prisma from "./config/db.js";
import redis from "./config/redis.js";
import env from "./config/env.js";
import logger from "./config/logger.js";
import registerProcessErrorHandlers from "./utils/processLogger.js";

import {
    startOutboxWorker,
    stopOutboxWorker,
} from "./jobs/outbox.worker.js";

import {
    startSeatHoldWorker,
    stopSeatHoldWorker,
} from "./workers/seat-hold-worker.js";

import {
    startSeatReleaseWorker,
    stopSeatReleaseWorker,
} from "./jobs/seatRelease.worker.js";

import {
    startHoldExpireWorker,
    stopHoldExpireWorker,
} from "./jobs/holdExpire.worker.js";

import {
    startWebhookRetryWorker,
    stopWebhookRetryWorker,
} from "./jobs/webhookRetry.worker.js";

import {
    startOutboxPublishWorker,
    stopOutboxPublishWorker,
} from "./jobs/outboxPublish.worker.js";

import {
    startOutboxDispatcher,
    stopOutboxDispatcher,
} from "./jobs/outbox.dispatcher.js";

const startServer = async () => {
    try {
        let dbConnected = false;
        let redisConnected = false;

        // --------------------------------------------------
        // 1. Check PostgreSQL Connection
        // --------------------------------------------------
        try {
            await prisma.$connect();
            logger.info("PostgreSQL connected successfully");
            dbConnected = true;
        } catch (dbError) {
            logger.warn(
                { error: dbError.message },
                "PostgreSQL initial connection warning. API running with DB reconnection pending."
            );
        }

        // --------------------------------------------------
        // 2. Check Redis Connection (Resilient check)
        // --------------------------------------------------
        try {
            redisConnected = await new Promise((resolve) => {
                const timer = setTimeout(() => resolve(false), 1200);
                redis.connect()
                    .then(() => redis.ping())
                    .then(() => {
                        clearTimeout(timer);
                        resolve(true);
                    })
                    .catch(() => {
                        clearTimeout(timer);
                        resolve(false);
                    });
            });

            if (redisConnected) {
                logger.info("Redis connected successfully");
            } else {
                logger.warn("Redis is offline or timed out. Operating in high-reliability DB fallback mode.");
            }
        } catch {
            redisConnected = false;
        }

        // --------------------------------------------------
        // 3. Start HTTP server (Always listen on port)
        // --------------------------------------------------
        const server = app.listen(env.port, () => {
            logger.info(`SeatLock server running on http://localhost:${env.port}`);
        });

        // --------------------------------------------------
        // 4. Start BullMQ Background Workers (if Redis ready)
        // --------------------------------------------------
        let holdFallbackInterval = null;
        let outboxFallbackInterval = null;

        if (redisConnected) {
            try {
                startOutboxWorker();
                startSeatReleaseWorker();
                await startHoldExpireWorker();
                await startSeatHoldWorker();
                startWebhookRetryWorker();
                startOutboxPublishWorker();
                logger.info("BullMQ background workers initialized");
            } catch (workerErr) {
                logger.warn({ error: workerErr.message }, "Background worker initialization warning");
            }
        } else {
            logger.warn("[Queue] Local Redis not detected. Background hold-expiration and outbox dispatchers will run in in-memory interval fallback.");

            // In-memory interval fallback: periodic hold expiration scan every 30s
            let isScanningHolds = false;
            holdFallbackInterval = setInterval(async () => {
                if (isScanningHolds) return;
                isScanningHolds = true;
                try {
                    const { scanAndExpireHoldsService } = await import("./services/holdExpire.service.js");
                    const res = await scanAndExpireHoldsService();
                    if (res?.expiredSeatsCount > 0) {
                        logger.info({ expiredSeats: res.expiredSeatsCount }, "[Memory Fallback] Expired seats reclaimed");
                    }
                } catch {
                    // ignore fallback scan errors
                } finally {
                    isScanningHolds = false;
                }
            }, 30000);

            // In-memory interval fallback: periodic outbox dispatch every 15s
            if (dbConnected) {
                let isDispatchingOutbox = false;
                outboxFallbackInterval = setInterval(async () => {
                    if (isDispatchingOutbox) return;
                    isDispatchingOutbox = true;
                    try {
                        const { fetchPendingEvents } = await import("./repositories/outbox.repository.js");
                        const { processOutboxEvent } = await import("./services/outboxProcessor.service.js");
                        const pendingEvents = await fetchPendingEvents(10);
                        for (const ev of (pendingEvents || [])) {
                            await processOutboxEvent(ev.id);
                        }
                    } catch {
                        // ignore fallback outbox errors
                    } finally {
                        isDispatchingOutbox = false;
                    }
                }, 15000);
            }
        }

        // --------------------------------------------------
        // 5. Start Outbox Dispatcher (if DB and Redis ready)
        // --------------------------------------------------
        if (dbConnected && redisConnected) {
            startOutboxDispatcher();
        }

        // --------------------------------------------------
        // 6. Graceful Shutdown
        // --------------------------------------------------
        let isShuttingDown = false;

        const shutdown = async (signal) => {
            if (isShuttingDown) {
                return;
            }

            isShuttingDown = true;
            logger.info(`${signal} received. Shutting down gracefully...`);

            // Stop accepting new HTTP requests
            server.close(async () => {
                try {
                    // 1. Stop dispatchers and memory intervals
                    stopOutboxDispatcher();
                    if (holdFallbackInterval) clearInterval(holdFallbackInterval);
                    if (outboxFallbackInterval) clearInterval(outboxFallbackInterval);

                    // 2. Stop and flush BullMQ workers
                    await Promise.allSettled([
                        stopOutboxWorker(),
                        stopSeatReleaseWorker(),
                        stopHoldExpireWorker(),
                        stopSeatHoldWorker(),
                        stopWebhookRetryWorker(),
                        stopOutboxPublishWorker(),
                    ]);
                    logger.info("All BullMQ workers stopped and flushed");

                    // 3. Disconnect Redis
                    await redis.quit();
                    logger.info("Redis connection closed");

                    // 4. Disconnect PostgreSQL
                    await prisma.$disconnect();
                    logger.info("PostgreSQL connection closed");

                    logger.info("Server shutdown complete");
                    process.exit(0);
                } catch (error) {
                    logger.error({ error }, "Error during graceful shutdown");
                    process.exit(1);
                }
            });

            // Force shutdown timeout after 15s
            setTimeout(() => {
                logger.error("Graceful shutdown timed out. Forcing exit...");
                process.exit(1);
            }, 15000);
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        logger.error({ error }, "Server startup failed");
        process.exit(1);
    }
};

registerProcessErrorHandlers();
startServer();
