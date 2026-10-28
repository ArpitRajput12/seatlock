import { Router } from "express";

import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";
import idempotencyResponseMiddleware from "../middlewares/idempotencyResponse.middleware.js";

import {
    createSeat,
    getSeat,
    getScreenSeats,
    updateSeat,
    deleteSeat,
} from "../controllers/seat.controller.js";

import {
    holdSeats,
    releaseSeats,
} from "../controllers/seatHold.controller.js";

import {
    seatIdSchema,
    screenIdParamSchema,
    createSeatSchema,
    updateSeatSchema,
} from "../validations/seat.validation.js";

import {
    holdSeatsSchema,
    releaseSeatsSchema,
} from "../validations/seatHold.validation.js";

const router = Router();

// Seat Hold & Release directly under /seats
router.post(
    "/hold",
    authMiddleware,
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    validate(holdSeatsSchema),
    holdSeats
);

router.post(
    "/:showId/hold",
    authMiddleware,
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    validate(holdSeatsSchema),
    holdSeats
);

router.post(
    "/:showId/seats/hold",
    authMiddleware,
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    validate(holdSeatsSchema),
    holdSeats
);

router.post(
    "/release",
    authMiddleware,
    validate(releaseSeatsSchema),
    releaseSeats
);

router.post(
    "/:showId/release",
    authMiddleware,
    validate(releaseSeatsSchema),
    releaseSeats
);

router.post(
    "/:showId/seats/release",
    authMiddleware,
    validate(releaseSeatsSchema),
    releaseSeats
);

// Public Routes
router.get(
    "/screen/:screenId",
    validate(screenIdParamSchema),
    getScreenSeats
);

router.get(
    "/:seatId",
    validate(seatIdSchema),
    getSeat
);

// ADMIN Protected Routes
router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(createSeatSchema),
    createSeat
);

router.patch(
    "/:seatId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(updateSeatSchema),
    updateSeat
);

router.delete(
    "/:seatId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(seatIdSchema),
    deleteSeat
);

export default router;
