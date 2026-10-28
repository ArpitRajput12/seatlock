import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import rateLimitMiddleware from "../middlewares/rateLimit.middleware.js";
import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";
import idempotencyResponseMiddleware from "../middlewares/idempotencyResponse.middleware.js";
import { RATE_LIMIT } from "../constants/rateLimit.constants.js";
import {
    createBooking,
    getBooking,
    getMyBookings,
    cancelBooking,
} from "../controllers/booking.controller.js";
import {
    bookingIdSchema,
    createBookingSchema,
    cancelBookingSchema,
} from "../validations/booking.validation.js";

const router = Router();

// Create booking with pessimistic lock
router.post(
    "/",
    authMiddleware,
    rateLimitMiddleware({
        ...RATE_LIMIT.BOOKING,
        keyPrefix: "booking",
    }),
    validate(createBookingSchema),
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    createBooking
);

// Get current user bookings
router.get("/my", authMiddleware, getMyBookings);

// Get single booking by ID
router.get("/:bookingId", authMiddleware, validate(bookingIdSchema), getBooking);

// Cancel booking
router.post(
    "/:bookingId/cancel",
    authMiddleware,
    validate(cancelBookingSchema),
    cancelBooking
);

export default router;
