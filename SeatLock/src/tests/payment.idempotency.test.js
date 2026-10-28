import request from "supertest";

import app from "../app.js";
import prisma from "../config/db.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Payment Idempotency Test", () => {
    let bookingId;
    let showSeatId;

    beforeAll(async () => {
        const user =
            await prisma.user.findUnique({
                where: {
                    email: "seatlocktest2026@example.com",
                },
            });

        if (!user) {
            throw new Error(
                "Test user not found. Create the test user first."
            );
        }

        const token =
            generateAccessToken({
                userId: user.id,
                role: user.role,
            });

        /*
        ========================================================
        FIND AVAILABLE SEAT
        ========================================================
        */

        const showSeat =
            await prisma.showSeat.findFirst({
                where: {
                    status: "AVAILABLE",
                    show: {
                        isActive: true,
                    },
                },
            });

        if (!showSeat) {
            throw new Error(
                "No AVAILABLE ShowSeat found for payment test."
            );
        }

        showSeatId = showSeat.id;

        /*
        ========================================================
        CREATE FRESH BOOKING
        ========================================================
        */

        const bookingResponse =
            await request(app)
                .post("/api/v1/bookings")
                .set(
                    "Authorization",
                    `Bearer ${token}`
                )
                .send({
                    showId: showSeat.showId,
                    showSeatIds: [showSeat.id],
                });

        expect(bookingResponse.status).toBe(201);

        bookingId =
            bookingResponse.body.data.booking.id;

        console.log(
            "Payment test booking:",
            bookingId
        );
    });

    afterAll(async () => {
        /*
        ========================================================
        REMOVE ONLY BOOKINGSEAT
        KEEP BOOKING FOR PAYMENT / OUTBOX REFERENCES
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
        "should not create duplicate payment for same idempotency key",
        async () => {
            const user =
                await prisma.user.findUnique({
                    where: {
                        email: "seatlocktest2026@example.com",
                    },
                });

            expect(user).not.toBeNull();
            expect(bookingId).toBeDefined();

            const token =
                generateAccessToken({
                    userId: user.id,
                    role: user.role,
                });

            const idempotencyKey =
                `payment-test-${Date.now()}`;

            const payload = {
                bookingId,
            };

            const response1 =
                await request(app)
                    .post(
                        "/api/v1/payments/intent"
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`
                    )
                    .set(
                        "Idempotency-Key",
                        idempotencyKey
                    )
                    .send(payload);

            expect([200, 201]).toContain(
                response1.status
            );

            const response2 =
                await request(app)
                    .post(
                        "/api/v1/payments/intent"
                    )
                    .set(
                        "Authorization",
                        `Bearer ${token}`
                    )
                    .set(
                        "Idempotency-Key",
                        idempotencyKey
                    )
                    .send(payload);

            expect(response2.status).toBe(
                response1.status
            );

            const paymentId =
                response2.body.data?.payment?.id ||
                response2.body.data?.id;

            expect(paymentId).toBeDefined();

            console.log(
                "Payment idempotency statuses:",
                response1.status,
                response2.status
            );

            const payments =
                await prisma.payment.count({
                    where: {
                        bookingId,
                    },
                });

            console.log(
                "Payments for booking:",
                payments
            );

            expect(payments).toBe(1);
        },
        30000
    );
});