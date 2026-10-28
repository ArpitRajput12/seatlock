import { z } from "zod";

const createPaymentSchema = z.object({
    body: z.object({
        bookingId: z.string().uuid("Invalid booking ID"),
    }),
    params: z.object({}),
    query: z.object({}),
});

const paymentIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        paymentId: z.string().uuid("Invalid payment ID"),
    }),
    query: z.object({}),
});

export {
    createPaymentSchema,
    paymentIdSchema,
};