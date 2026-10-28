import { Router } from "express";

import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

import {
    createShow,
    getShow,
    getShows,
    updateShow,
    deleteShow,
} from "../controllers/show.controller.js";

import {
    showIdSchema,
    createShowSchema,
    updateShowSchema,
    getShowsSchema,
} from "../validations/show.validation.js";

import {
    holdSeats,
    releaseSeats,
} from "../controllers/seatHold.controller.js";

import {
    getShowSeatsList,
} from "../controllers/showSeat.controller.js";

import {
    holdSeatsSchema,
    releaseSeatsSchema,
} from "../validations/seatHold.validation.js";

import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";
import idempotencyResponseMiddleware from "../middlewares/idempotencyResponse.middleware.js";

const router = Router();

// Public Routes

router.get(
    "/",
    validate(getShowsSchema),
    getShows
);

router.get(
    "/:showId/seats",
    getShowSeatsList
);

router.get(
    "/:id/seats",
    getShowSeatsList
);

router.get(
    "/:showId",
    validate(showIdSchema),
    getShow
);

// User Protected Seat Hold & Release Routes

router.post(
    "/:showId/seats/hold",
    authMiddleware,
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    validate(holdSeatsSchema),
    holdSeats
);

router.post(
    "/:id/seats/hold",
    authMiddleware,
    idempotencyMiddleware({ required: false }),
    idempotencyResponseMiddleware,
    validate(holdSeatsSchema),
    holdSeats
);

router.post(
    "/:showId/seats/release",
    authMiddleware,
    validate(releaseSeatsSchema),
    releaseSeats
);

router.post(
    "/:id/seats/release",
    authMiddleware,
    validate(releaseSeatsSchema),
    releaseSeats
);

// ADMIN Protected Routes

router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(createShowSchema),
    createShow
);

router.put(
    "/:showId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(updateShowSchema),
    updateShow
);

router.delete(
    "/:showId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(showIdSchema),
    deleteShow
);

export default router;
