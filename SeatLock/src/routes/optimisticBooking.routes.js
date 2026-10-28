import { Router } from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";
import idempotencyResponseMiddleware from "../middlewares/idempotencyResponse.middleware.js";

import {
    createOptimisticBooking,
} from "../controllers/optimisticBooking.controller.js";

import {
    createBookingSchema,
} from "../validations/booking.validation.js";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validate(createBookingSchema),
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    createOptimisticBooking
);

export default router;