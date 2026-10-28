import { z } from "zod";

const seatIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        seatId: z.string().uuid("Invalid seat ID"),
    }),
    query: z.object({}),
});

const screenIdParamSchema = z.object({
    body: z.object({}),
    params: z.object({
        screenId: z.string().uuid("Invalid screen ID"),
    }),
    query: z.object({}),
});

const createSeatSchema = z.object({
    body: z.object({
        screenId: z.string().uuid("Invalid screen ID"),

        rowLabel: z
            .string()
            .trim()
            .min(1, "Row label is required")
            .max(10, "Row label cannot exceed 10 characters"),

        seatNumber: z
            .coerce
            .number()
            .int("Seat number must be a whole number")
            .positive("Seat number must be greater than 0")
            .max(100, "Seat number cannot exceed 100"),

        seatType: z
            .string()
            .trim()
            .min(1, "Seat type is required")
            .max(50, "Seat type cannot exceed 50 characters"),
    }),

    params: z.object({}),
    query: z.object({}),
});

const updateSeatSchema = z.object({
    body: z
        .object({
            rowLabel: z
                .string()
                .trim()
                .min(1, "Row label cannot be empty")
                .max(10, "Row label cannot exceed 10 characters")
                .optional(),

            seatNumber: z
                .coerce
                .number()
                .int("Seat number must be a whole number")
                .positive("Seat number must be greater than 0")
                .max(100, "Seat number cannot exceed 100")
                .optional(),

            seatType: z
                .string()
                .trim()
                .min(1, "Seat type cannot be empty")
                .max(50, "Seat type cannot exceed 50 characters")
                .optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field is required for update",
        }),

    params: z.object({
        seatId: z.string().uuid("Invalid seat ID"),
    }),

    query: z.object({}),
});

export {
    seatIdSchema,
    screenIdParamSchema,
    createSeatSchema,
    updateSeatSchema,
};