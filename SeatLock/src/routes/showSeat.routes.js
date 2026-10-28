import { Router } from "express";

import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

import {
    generateSeats,
    getShowSeat,
    getShowSeatsList,
    getAvailableShowSeats,
} from "../controllers/showSeat.controller.js";

import {
    showSeatIdSchema,
    showIdParamSchema,
    createShowSeatsSchema,
} from "../validations/showSeat.validation.js";

const router = Router();

// ADMIN - Generate ShowSeats
router.post(
    "/generate",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(createShowSeatsSchema),
    generateSeats
);

// Public - All seats of a show
router.get(
    "/show/:showId",
    validate(showIdParamSchema),
    getShowSeatsList
);

// Public - Available seats
router.get(
    "/show/:showId/available",
    validate(showIdParamSchema),
    getAvailableShowSeats
);

// Public - Single ShowSeat
router.get(
    "/:showSeatId",
    validate(showSeatIdSchema),
    getShowSeat
);

export default router;