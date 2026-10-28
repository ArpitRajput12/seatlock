import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getPayment,
} from "../controllers/payment.controller.js";
import { paymentIdSchema } from "../validations/payment.validation.js";

const router = Router();

/**
 * Razorpay Payment Gateway Routes
 */
router.post(
    "/razorpay/create-order",
    authMiddleware,
    createRazorpayOrder
);

router.post(
    "/razorpay/verify-payment",
    authMiddleware,
    verifyRazorpayPayment
);

router.get(
    "/:paymentId",
    authMiddleware,
    validate(paymentIdSchema),
    getPayment
);

export default router;
