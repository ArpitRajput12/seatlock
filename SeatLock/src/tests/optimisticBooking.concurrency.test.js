import request from "supertest";

import app from "../app.js";
import prisma from "../config/db.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Optimistic Booking Concurrency Test", () => {
    let showSeatId;

    beforeAll(async () => {
        const user = await prisma.user.findUnique({
            where: {
                email: "seatlocktest2026@example.com",
            },
        });

        if (!user) {
            throw new Error(
                "Test user not found. Create the test user first."
            );
        }

        /*
        ========================================================
        FIND AVAILABLE SEAT
        ========================================================
        */

        let showSeat =
            await prisma.showSeat.findFirst({
                where: {
                    status: "AVAILABLE",
                    show: {
                        isActive: true,
                    },
                },
            });

        /*
        ========================================================
        RECYCLE OLD TEST USER PENDING SEAT
        ========================================================
        */

        if (!showSeat) {
            const oldBookingSeat =
                await prisma.bookingSeat.findFirst({
                    where: {
                        booking: {
                            userId: user.id,
                            status: "PENDING",
                        },
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
                    where: {
                        showSeatId,
                    },
                });

                await prisma.showSeat.update({
                    where: {
                        id: showSeatId,
                    },
                    data: {
                        status: "AVAILABLE",
                        holdToken: null,
                        holdExpiresAt: null,
                        version: {
                            increment: 1,
                        },
                    },
                });

                showSeat =
                    await prisma.showSeat.findUnique({
                        where: {
                            id: showSeatId,
                        },
                    });
            }
        }

        if (!showSeat) {
            throw new Error(
                "No test ShowSeat available. Please create at least one ShowSeat."
            );
        }

        showSeatId = showSeat.id;

        await prisma.bookingSeat.deleteMany({
            where: {
                showSeatId,
            },
        });

        await prisma.showSeat.update({
            where: {
                id: showSeatId,
            },
            data: {
                status: "AVAILABLE",
                holdToken: null,
                holdExpiresAt: null,
            },
        });

        console.log(
            "Optimistic test seat:",
            showSeat.id
        );

        console.log(
            "Optimistic test show:",
            showSeat.showId
        );
    });

    afterAll(async () => {
        /*
        ========================================================
        CLEAN TEST SEAT
        ========================================================
        */

        if (showSeatId) {
            await prisma.bookingSeat.deleteMany({
                where: {
                    showSeatId,
                },
            });

            await prisma.showSeat.update({
                where: {
                    id: showSeatId,
                },
                data: {
                    status: "AVAILABLE",
                    holdToken: null,
                    holdExpiresAt: null,
                    version: {
                        increment: 1,
                    },
                },
            });
        }

        await prisma.$disconnect();
    });

    test(
        "should allow only ONE request to book the same seat",
        async () => {
            const user =
                await prisma.user.findUnique({
                    where: {
                        email: "seatlocktest2026@example.com",
                    },
                });

            expect(user).not.toBeNull();

            const token =
                generateAccessToken({
                    userId: user.id,
                    role: user.role,
                });

            const showSeat =
                await prisma.showSeat.findUnique({
                    where: {
                        id: showSeatId,
                    },
                });

            expect(showSeat).not.toBeNull();

            const payload = {
                showId: showSeat.showId,
                showSeatIds: [showSeat.id],
            };

            const requests = Array.from(
                { length: 10 },
                () =>
                    request(app)
                        .post(
                            "/api/v1/optimistic-bookings"
                        )
                        .set(
                            "Authorization",
                            `Bearer ${token}`
                        )
                        .send(payload)
            );

            const responses =
                await Promise.all(requests);

            const statusCounts =
                responses.reduce(
                    (acc, response) => {
                        acc[response.status] =
                            (acc[response.status] || 0) + 1;

                        return acc;
                    },
                    {}
                );

            console.log(
                "Optimistic response status counts:",
                statusCounts
            );

            expect(statusCounts[201]).toBe(1);
            expect(statusCounts[409]).toBe(9);

            const finalSeat =
                await prisma.showSeat.findUnique({
                    where: {
                        id: showSeat.id,
                    },
                });

            expect(finalSeat.status).toBe(
                "HELD"
            );

            console.log(
                "Optimistic final seat status:",
                finalSeat.status
            );

            const bookingSeats =
                await prisma.bookingSeat.count({
                    where: {
                        showSeatId: showSeat.id,
                    },
                });

            console.log(
                "Optimistic BookingSeat records:",
                bookingSeats
            );

            expect(bookingSeats).toBe(1);
        },
        30000
    );
});