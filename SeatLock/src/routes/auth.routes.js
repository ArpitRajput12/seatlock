import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import rateLimitMiddleware from "../middlewares/rateLimit.middleware.js";
import {
    register,
    login,
    logout,
    refreshToken,
    currentUser,
} from "../controllers/auth.controller.js";
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    logoutSchema,
} from "../validations/auth.validation.js";
import { RATE_LIMIT } from "../constants/rateLimit.constants.js";

const router = Router();

// Public authentication routes
router.post(
    "/register",
    rateLimitMiddleware({
        ...RATE_LIMIT.AUTH,
        keyPrefix: "register",
    }),
    validate(registerSchema),
    register
);

router.post(
    "/login",
    rateLimitMiddleware({
        ...RATE_LIMIT.AUTH,
        keyPrefix: "login",
    }),
    validate(loginSchema),
    login
);

router.post(
    "/refresh-token",
    rateLimitMiddleware({
        ...RATE_LIMIT.AUTH,
        keyPrefix: "refresh-token",
    }),
    validate(refreshTokenSchema),
    refreshToken
);

// Protected session routes
router.get("/me", authMiddleware, currentUser);
router.post("/logout", authMiddleware, validate(logoutSchema), logout);

export default router;
