import { z } from "zod";

const sanitizeUuid = (val) =>
    typeof val === "string" ? val.trim().replace(/\s+/g, "-") : val;

const bookingIdSchema = z.object({
    body: z.object({}),

    params: z.object({
        bookingId: z.preprocess(sanitizeUuid, z.string().uuid("Invalid booking ID")),
    }),

    query: z.object({}),
});

const createBookingSchema = z.object({
    body: z.object({
        showId: z.preprocess(sanitizeUuid, z.string().uuid("Invalid show ID")),

        showSeatIds: z
            .array(
                z.preprocess(sanitizeUuid, z.string().uuid("Invalid show seat ID"))
            )
            .min(
                1,
                "At least one seat must be selected"
            )
            .max(
                10,
                "You can book maximum 10 seats at once"
            ),

        holdToken: z.string().optional(),
    }),

    params: z.object({}),
    query: z.object({}),
});

const cancelBookingSchema = z.object({
    body: z.object({
        reason: z
            .string()
            .trim()
            .max(255, "Reason cannot exceed 255 characters")
            .optional(),
    }),

    params: z.object({
        bookingId: z.preprocess(sanitizeUuid, z.string().uuid("Invalid booking ID")),
    }),

    query: z.object({}),
});

export {
    bookingIdSchema,
    createBookingSchema,
    cancelBookingSchema,
};
