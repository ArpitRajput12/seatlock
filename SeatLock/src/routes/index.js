import { Router } from "express";

import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import movieRoutes from "./movie.routes.js";
import theaterRoutes from "./theater.routes.js";
import screenRoutes from "./screen.routes.js";
import seatRoutes from "./seat.routes.js";
import showRoutes from "./show.routes.js";
import showSeatRoutes from "./showSeat.routes.js";
import bookingRoutes from "./booking.routes.js";
import optimisticBookingRoutes from "./optimisticBooking.routes.js";
import redlockBookingRoutes from "./redlockBooking.routes.js";
import paymentRoutes from "./payment.routes.js";
import adminRoutes from "./admin.routes.js";
import rateLimitMiddleware from "../middlewares/rateLimit.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";
import idempotencyResponseMiddleware from "../middlewares/idempotencyResponse.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { holdSeats, releaseSeats } from "../controllers/seatHold.controller.js";
import { holdSeatsSchema, releaseSeatsSchema } from "../validations/seatHold.validation.js";

import { RATE_LIMIT } from "../constants/rateLimit.constants.js";

const router = Router();

// Health check route (unthrottled)
router.use("/health", healthRoutes);

// Apply general rate limit to all subsequent API routes
router.use(
    rateLimitMiddleware({
        ...RATE_LIMIT.GENERAL,
        keyPrefix: "general",
    })
);

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/movies", movieRoutes);
router.use("/theaters", theaterRoutes);
router.use("/screens", screenRoutes);
router.use("/seats", seatRoutes);
router.use("/shows", showRoutes);
router.use("/show-seats", showSeatRoutes);
router.use("/bookings", bookingRoutes);
router.use("/optimistic-bookings", optimisticBookingRoutes);
router.use("/redlock-bookings", redlockBookingRoutes);
router.use("/payments", paymentRoutes);

// Direct top-level aliases for show seat hold & release to guarantee zero 404s
router.post(
    "/shows/:id/seats/hold",
    authMiddleware,
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    validate(holdSeatsSchema),
    holdSeats
);
router.post(
    "/shows/:showId/seats/hold",
    authMiddleware,
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    validate(holdSeatsSchema),
    holdSeats
);
router.post(
    "/shows/:id/seats/release",
    authMiddleware,
    validate(releaseSeatsSchema),
    releaseSeats
);
router.post(
    "/shows/:showId/seats/release",
    authMiddleware,
    validate(releaseSeatsSchema),
    releaseSeats
);

export default router;