import request from "supertest";
import app from "../app.js";

describe("Health Check Endpoints", () => {
    test("GET /api/v1/health should return UP status with DB and Redis checks", async () => {
        const response = await request(app).get("/api/v1/health");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe("UP");
        expect(response.body.services.database.status).toBe("UP");
        expect(response.body.services.redis.status).toBe("UP");
        expect(typeof response.body.services.database.latencyMs).toBe("number");
        expect(typeof response.body.services.redis.latencyMs).toBe("number");
        expect(response.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    test("GET /api/v1/health/liveness should return UP", async () => {
        const response = await request(app).get("/api/v1/health/liveness");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("UP");
    });

    test("GET /api/v1/health/readiness should return READY", async () => {
        const response = await request(app).get("/api/v1/health/readiness");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("READY");
    });
});

