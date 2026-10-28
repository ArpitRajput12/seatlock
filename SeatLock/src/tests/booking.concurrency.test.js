import request from "supertest";

import app from "../app.js";
import prisma from "../config/db.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Booking Concurrency Test", () => {
    let accessToken;
    let showId;
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

        accessToken = generateAccessToken({
            userId: user.id,
            role: user.role,
        });

        /*
        ========================================================
        FIND AVAILABLE SEAT
        ========================================================
        */

        let availableSeat = await prisma.showSeat.findFirst({
            where: {
                status: "AVAILABLE",
                show: {
                    isActive: true,
                },
            },
        });

        /*
        ========================================================
        IF NO AVAILABLE SEAT EXISTS
        RECYCLE AN OLD TEST-USER HELD SEAT
        ========================================================
        */

        if (!availableSeat) {
            const oldBookingSeat =
                await prisma.bookingSeat.findFirst({
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

                availableSeat =
                    await prisma.showSeat.findUnique({
                        where: {
                            id: showSeatId,
                        },
                    });
            }
        }

        if (!availableSeat) {
            throw new Error(
                "No test ShowSeat available. Please create at least one ShowSeat."
            );
        }

        showSeatId = availableSeat.id;
        showId = availableSeat.showId;

        console.log(
            "Concurrency test seat:",
            showSeatId
        );

        console.log(
            "Concurrency test show:",
            showId
        );
    });

    afterAll(async () => {
        /*
        ========================================================
        CLEAN ONLY BOOKINGSEAT RECORDS FOR TEST SEAT
        DO NOT DELETE BOOKING
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
        "should allow only ONE request to hold the same seat",
        async () => {
            const requestCount = 10;

            const requests = Array.from(
                { length: requestCount },
                () =>
                    request(app)
                        .post("/api/v1/bookings")
                        .set(
                            "Authorization",
                            `Bearer ${accessToken}`
                        )
                        .send({
                            showId,
                            showSeatIds: [showSeatId],
                        })
            );

            const responses =
                await Promise.all(requests);

            const statusCounts =
                responses.reduce(
                    (counts, response) => {
                        counts[response.status] =
                            (counts[response.status] || 0) + 1;

                        return counts;
                    },
                    {}
                );

            console.log(
                "Concurrency response status counts:",
                statusCounts
            );

            expect(statusCounts[201]).toBe(1);
            expect(statusCounts[409]).toBe(9);

            const successfulResponse =
                responses.find(
                    (response) =>
                        response.status === 201
                );

            expect(successfulResponse).toBeDefined();

            console.log(
                "Successful booking:",
                successfulResponse.body
            );

            const finalSeat =
                await prisma.showSeat.findUnique({
                    where: {
                        id: showSeatId,
                    },
                });

            expect(finalSeat).not.toBeNull();
            expect(finalSeat.status).toBe("HELD");

            console.log(
                "Final seat status:",
                finalSeat.status
            );

            const bookingSeats =
                await prisma.bookingSeat.findMany({
                    where: {
                        showSeatId,
                    },
                });

            expect(bookingSeats).toHaveLength(1);

            console.log(
                "BookingSeat records:",
                bookingSeats.length
            );
        },
        30000
    );
});