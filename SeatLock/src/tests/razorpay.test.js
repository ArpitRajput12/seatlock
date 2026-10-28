import crypto from "crypto";
import request from "supertest";
import app from "../app.js";
import prisma from "../config/db.js";
import env from "../config/env.js";
import { generateAccessToken } from "../utils/jwt.js";

describe("Razorpay Test API Gateway Integration", () => {
    let testUser;
    let accessToken;
    let showSeat1;
    let showSeat2;
    let booking1Id;
    let booking2Id;

    beforeAll(async () => {
        testUser = await prisma.user.findFirst({
            where: { email: "seatlocktest2026@example.com" },
        });

        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    email: "seatlocktest2026@example.com",
                    name: "SeatLock Test User",
                    password: "password123",
                    role: "USER",
                },
            });
        }

        accessToken = generateAccessToken({
            userId: testUser.id,
            role: testUser.role,
        });

        const availableSeats = await prisma.showSeat.findMany({
            where: {
                status: "AVAILABLE",
                show: { isActive: true },
            },
            take: 2,
        });

        if (availableSeats.length < 2) {
            throw new Error("Need at least 2 available seats in database to run tests");
        }

        showSeat1 = availableSeats[0];
        showSeat2 = availableSeats[1];
    });

    afterAll(async () => {
        if (showSeat1) {
            await prisma.bookingSeat.deleteMany({
                where: { showSeatId: showSeat1.id },
            });
            await prisma.showSeat.update({
                where: { id: showSeat1.id },
                data: {
                    status: "AVAILABLE",
                    holdToken: null,
                    holdExpiresAt: null,
                    version: { increment: 1 },
                },
            });
        }
        if (booking1Id) {
            await prisma.payment.deleteMany({ where: { bookingId: booking1Id } });
            await prisma.booking.delete({ where: { id: booking1Id } });
        }
        if (showSeat2) {
            await prisma.bookingSeat.deleteMany({
                where: { showSeatId: showSeat2.id },
            });
            await prisma.showSeat.update({
                where: { id: showSeat2.id },
                data: {
                    status: "AVAILABLE",
                    holdToken: null,
                    holdExpiresAt: null,
                    version: { increment: 1 },
                },
            });
        }
        if (booking2Id) {
            await prisma.payment.deleteMany({ where: { bookingId: booking2Id } });
            await prisma.booking.delete({ where: { id: booking2Id } });
        }
        await prisma.$disconnect();
    });

    test("should hold seat, create Razorpay order, and verify payment with valid signature", async () => {
        // 1. Hold seat
        const holdRes = await request(app)
            .post(`/api/v1/shows/${showSeat1.showId}/seats/hold`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ showSeatIds: [showSeat1.id] });

        expect(holdRes.status).toBe(201);
        booking1Id = holdRes.body.data.bookingId;
        expect(booking1Id).toBeDefined();

        // 2. Create Razorpay order
        const orderRes = await request(app)
            .post("/api/v1/payments/razorpay/create-order")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ bookingId: booking1Id });

        expect(orderRes.status).toBe(201);
        const { orderId, amount, currency, key, keyId } = orderRes.body.data;
        expect(orderId).toBeDefined();
        expect(amount).toBeGreaterThan(0);
        expect(currency).toBe("INR");
        expect(key || keyId).toBeDefined();

        // 3. Verify payment with valid HMAC SHA256 signature
        const mockPaymentId = `pay_${Date.now()}_jest`;
        const validSignature = crypto
            .createHmac("sha256", env.razorpay.keySecret || "YourTestKeySecretHere")
            .update(`${orderId}|${mockPaymentId}`)
            .digest("hex");

        const verifyRes = await request(app)
            .post("/api/v1/payments/razorpay/verify-payment")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                bookingId: booking1Id,
                razorpay_order_id: orderId,
                razorpay_payment_id: mockPaymentId,
                razorpay_signature: validSignature,
            });

        expect(verifyRes.status).toBe(200);
        expect(verifyRes.body.data.status).toBe("SUCCEEDED");

        // 4. Verify DB state
        const confirmedBooking = await prisma.booking.findUnique({
            where: { id: booking1Id },
        });
        const bookedSeat = await prisma.showSeat.findUnique({
            where: { id: showSeat1.id },
        });
        expect(confirmedBooking.status).toBe("CONFIRMED");
        expect(bookedSeat.status).toBe("BOOKED");
    });

    test("should reject invalid signature and trigger compensating cancellation", async () => {
        // 1. Hold seat 2
        const holdRes = await request(app)
            .post(`/api/v1/shows/${showSeat2.showId}/seats/hold`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ showSeatIds: [showSeat2.id] });

        expect(holdRes.status).toBe(201);
        booking2Id = holdRes.body.data.bookingId;

        // 2. Create order
        const orderRes = await request(app)
            .post("/api/v1/payments/razorpay/create-order")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ bookingId: booking2Id });

        expect(orderRes.status).toBe(201);
        const { orderId } = orderRes.body.data;

        // 3. Verify with invalid signature
        const failRes = await request(app)
            .post("/api/v1/payments/razorpay/verify-payment")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                bookingId: booking2Id,
                razorpay_order_id: orderId,
                razorpay_payment_id: "pay_tampered_jest",
                razorpay_signature: "invalid_tampered_signature_jest",
            });

        expect(failRes.status).toBe(400);

        // 4. Verify compensating cancellation in DB
        const cancelledBooking = await prisma.booking.findUnique({
            where: { id: booking2Id },
        });
        const releasedSeat = await prisma.showSeat.findUnique({
            where: { id: showSeat2.id },
        });
        expect(cancelledBooking.status).toBe("CANCELLED");
        expect(releasedSeat.status).toBe("AVAILABLE");
    });
});

