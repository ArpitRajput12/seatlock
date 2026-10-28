import { Router } from "express";
import prisma from "../config/db.js";
import redis from "../config/redis.js";

const router = Router();

// Full system health verification (PostgreSQL & Redis)
router.get("/", async (req, res) => {
    const checks = {
        database: { status: "DOWN", latencyMs: null },
        redis: { status: "DOWN", latencyMs: null },
    };

    let isHealthy = true;

    // Check PostgreSQL
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        checks.database.latencyMs = Date.now() - dbStart;
        checks.database.status = "UP";
    } catch (err) {
        isHealthy = false;
        checks.database.error = err.message;
    }

    // Check Redis
    try {
        const redisStart = Date.now();
        await Promise.race([
            redis.ping(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Redis ping timeout")), 1000))
        ]);
        checks.redis.latencyMs = Date.now() - redisStart;
        checks.redis.status = "UP";
    } catch (err) {
        checks.redis.status = "DOWN";
        checks.redis.error = err.message;
    }

    const statusCode = isHealthy ? 200 : 503;

    return res.status(statusCode).json({
        success: isHealthy,
        status: isHealthy ? "UP" : "DEGRADED",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        services: checks,
    });
});

// Liveness probe
router.get("/liveness", (req, res) => {
    return res.status(200).json({
        status: "UP",
        uptimeSeconds: Math.floor(process.uptime()),
    });
});

// Readiness probe
router.get("/readiness", async (req, res) => {
    try {
        await Promise.all([
            prisma.$queryRaw`SELECT 1`,
            redis.ping(),
        ]);

        return res.status(200).json({
            status: "READY",
        });
    } catch (err) {
        return res.status(503).json({
            status: "NOT_READY",
            error: err.message,
        });
    }
});

export default router;
