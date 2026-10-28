import request from "supertest";

import app from "../app.js";
import prisma from "../config/db.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Seat Hold & Release Concurrency Test", () => {
    let accessToken;
    let showId;
    let showSeatId;
    let user;

    beforeAll(async () => {
        user = await prisma.user.findUnique({
            where: {
                email: "seatlocktest2026@example.com",
            },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: "seatlocktest2026@example.com",
                    name: "SeatLock Test User",
                    password: "password123",
                    role: "USER",
                },
            });
        }

        accessToken = generateAccessToken({
            userId: user.id,
            role: user.role,
        });

        let availableSeat = await prisma.showSeat.findFirst({
            where: {
                status: "AVAILABLE",
                show: {
                    isActive: true,
                },
            },
        });

        if (!availableSeat) {
            const oldBookingSeat = await prisma.bookingSeat.findFirst({
                where: {
                    booking: {
                        userId: user.id,
                        status: "PENDING",
                    },
                },
                include: {
                    booking: true,
                },
                orderBy: {
                    booking: {
                        createdAt: "desc",
                    },
                },
            });

            if (oldBookingSeat) {
                showSeatId = oldBookingSeat.showSeatId;

                await prisma.bookingSeat.deleteMany({
                    where: { showSeatId },
                });

                await prisma.showSeat.update({
                    where: { id: showSeatId },
                    data: {
                        status: "AVAILABLE",
                        holdToken: null,
                        holdExpiresAt: null,
                        version: { increment: 1 },
                    },
                });

                availableSeat = await prisma.showSeat.findUnique({
                    where: { id: showSeatId },
                });
            }
        }

        if (!availableSeat) {
            throw new Error("No test ShowSeat available");
        }

        showSeatId = availableSeat.id;
        showId = availableSeat.showId;
    });

    afterAll(async () => {
        if (showSeatId) {
            await prisma.bookingSeat.deleteMany({
                where: { showSeatId },
            });

            await prisma.showSeat.update({
                where: { id: showSeatId },
                data: {
                    status: "AVAILABLE",
                    holdToken: null,
                    holdExpiresAt: null,
                    version: { increment: 1 },
                },
            });
        }

        await prisma.$disconnect();
    });

    test("should hold seat, return hold_token and hold_expires_at, and reject concurrent attempts", async () => {
        // Reset seat to AVAILABLE
        await prisma.showSeat.update({
            where: { id: showSeatId },
            data: {
                status: "AVAILABLE",
                holdToken: null,
                holdExpiresAt: null,
                version: { increment: 1 },
            },
        });

        const requestCount = 10;
        const requests = Array.from({ length: requestCount }, () =>
            request(app)
                .post(`/api/v1/shows/${showId}/seats/hold`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    showSeatIds: [showSeatId],
                    strategy: "PESSIMISTIC",
                })
        );

        const responses = await Promise.all(requests);

        const statusCounts = responses.reduce((counts, response) => {
            counts[response.status] = (counts[response.status] || 0) + 1;
            return counts;
        }, {});

        expect(statusCounts[201]).toBe(1);
        expect(statusCounts[409]).toBe(requestCount - 1);

        const successful = responses.find((r) => r.status === 201);
        expect(successful).toBeDefined();
        expect(successful.body.data.holdToken).toBeDefined();
        expect(successful.body.data.holdExpiresAt).toBeDefined();
        expect(successful.body.data.expiresInSeconds).toBe(600);

        const holdToken = successful.body.data.holdToken;

        // Release the seat via /shows/:id/seats/release
        const releaseRes = await request(app)
            .post(`/api/v1/shows/${showId}/seats/release`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                holdToken,
            });

        expect(releaseRes.status).toBe(200);
        expect(releaseRes.body.data.released).toBe(true);

        const releasedSeat = await prisma.showSeat.findUnique({
            where: { id: showSeatId },
        });

        expect(releasedSeat.status).toBe("AVAILABLE");
        expect(releasedSeat.holdToken).toBeNull();
    }, 30000);
});

