import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import {
    createTheater,
    getAllTheaters,
    getTheater,
    updateTheater,
    deleteTheater,
} from "../controllers/theater.controller.js";
import {
    theaterIdSchema,
    createTheaterSchema,
    updateTheaterSchema,
    getTheatersSchema,
} from "../validations/theater.validation.js";

const router = Router();

// Public catalog routes
router.get("/", validate(getTheatersSchema), getAllTheaters);
router.get("/:theaterId", validate(theaterIdSchema), getTheater);

// Admin theater management
router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(createTheaterSchema),
    createTheater
);

router.patch(
    "/:theaterId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(updateTheaterSchema),
    updateTheater
);

router.delete(
    "/:theaterId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(theaterIdSchema),
    deleteTheater
);

export default router;
