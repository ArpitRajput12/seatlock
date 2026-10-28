import { z } from "zod";

const showSeatIdSchema = z.object({
    body: z.object({}),

    params: z.object({
        showSeatId: z.string().uuid("Invalid show seat ID"),
    }),

    query: z.object({}),
});

const showIdParamSchema = z.object({
    body: z.object({}),

    params: z.object({
        showId: z.string().uuid("Invalid show ID"),
    }),

    query: z.object({}),
});

const createShowSeatsSchema = z.object({
    body: z.object({
        showId: z.string().uuid("Invalid show ID"),
    }),

    params: z.object({}),
    query: z.object({}),
});

export {
    showSeatIdSchema,
    showIdParamSchema,
    createShowSeatsSchema,
};