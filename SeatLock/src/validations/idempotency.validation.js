import { z } from "zod";

const idempotencyKeySchema = z.object({
    body: z.object({
        bookingId: z.string().uuid("Invalid booking ID"),
    }),

    params: z.object({}),

    query: z.object({}),
});

export {
    idempotencyKeySchema,
};