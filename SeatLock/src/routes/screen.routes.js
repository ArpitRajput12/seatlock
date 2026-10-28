import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import {
    createScreen,
    getScreen,
    getTheaterScreens,
    updateScreen,
    deleteScreen,
} from "../controllers/screen.controller.js";
import {
    screenIdSchema,
    theaterIdParamSchema,
    createScreenSchema,
    updateScreenSchema,
} from "../validations/screen.validation.js";

const router = Router();

// Public routes
router.get(
    "/theater/:theaterId",
    validate(theaterIdParamSchema),
    getTheaterScreens
);

router.get(
    "/:screenId",
    validate(screenIdSchema),
    getScreen
);

// Admin screen management
router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(createScreenSchema),
    createScreen
);

router.patch(
    "/:screenId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(updateScreenSchema),
    updateScreen
);

router.delete(
    "/:screenId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(screenIdSchema),
    deleteScreen
);

export default router;
