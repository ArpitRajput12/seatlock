import request from "supertest";

import app from "../app.js";
import prisma from "../config/db.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Booking Cancellation & Refund Flow Test", () => {
    let accessToken;
    let user;
    let showId;
    let showSeatId;

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

        const showSeat = await prisma.showSeat.findFirst({
            where: {
                status: "AVAILABLE",
                show: {
                    isActive: true,
                },
            },
        });

        if (!showSeat) {
            throw new Error("No available showSeat for cancellation test");
        }

        showSeatId = showSeat.id;
        showId = showSeat.showId;
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

    test("should successfully cancel pending booking, release seats, and publish outbox events", async () => {
        // 1. Create a hold/pending booking
        const holdRes = await request(app)
            .post(`/api/v1/shows/${showId}/seats/hold`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                showSeatIds: [showSeatId],
                strategy: "PESSIMISTIC",
            });

        expect(holdRes.status).toBe(201);
        const bookingId = holdRes.body.data.bookingId;
        expect(bookingId).toBeDefined();

        // 2. Verify seat is HELD
        const heldSeat = await prisma.showSeat.findUnique({
            where: { id: showSeatId },
        });
        expect(heldSeat.status).toBe("HELD");

        // 3. User cancels booking via POST /api/v1/bookings/:bookingId/cancel
        const cancelRes = await request(app)
            .post(`/api/v1/bookings/${bookingId}/cancel`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                reason: "Changed my mind",
            });

        expect(cancelRes.status).toBe(200);
        expect(cancelRes.body.data.cancelled).toBe(true);
        expect(cancelRes.body.data.status).toBe("CANCELLED");
        expect(cancelRes.body.data.releasedSeatCount).toBe(1);

        // 4. Verify seat is back to AVAILABLE
        const releasedSeat = await prisma.showSeat.findUnique({
            where: { id: showSeatId },
        });
        expect(releasedSeat.status).toBe("AVAILABLE");
        expect(releasedSeat.holdToken).toBeNull();
        expect(releasedSeat.holdExpiresAt).toBeNull();

        // 5. Verify booking in DB is CANCELLED
        const dbBooking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });
        expect(dbBooking.status).toBe("CANCELLED");
        expect(dbBooking.cancelledAt).not.toBeNull();

        // 6. Verify Outbox Events
        const outboxEvents = await prisma.outboxEvent.findMany({
            where: {
                aggregateId: bookingId,
                eventType: { in: ["BOOKING_CANCELLED", "SEATS_RELEASED"] },
            },
        });
        expect(outboxEvents.length).toBeGreaterThanOrEqual(1);

        // 7. Duplicate cancellation should return 409 CONFLICT
        const duplicateCancel = await request(app)
            .post(`/api/v1/bookings/${bookingId}/cancel`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send();

        expect(duplicateCancel.status).toBe(409);
    }, 30000);
});

