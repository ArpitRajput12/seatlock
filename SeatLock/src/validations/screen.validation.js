import { z } from "zod";

const screenIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        screenId: z.string().uuid("Invalid screen ID"),
    }),
    query: z.object({}),
});

const theaterIdParamSchema = z.object({
    body: z.object({}),
    params: z.object({
        theaterId: z.string().uuid("Invalid theater ID"),
    }),
    query: z.object({}),
});

const createScreenSchema = z.object({
    body: z.object({
        theaterId: z.string().uuid("Invalid theater ID"),
        name: z
            .string()
            .trim()
            .min(1, "Screen name is required")
            .max(100, "Screen name cannot exceed 100 characters"),
        totalSeats: z
            .coerce
            .number()
            .int("Total seats must be a whole number")
            .positive("Total seats must be greater than 0")
            .max(1000, "Total seats cannot exceed 1000"),
        isActive: z.boolean().optional(),
    }),
    params: z.object({}),
    query: z.object({}),
});

const updateScreenSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(1, "Screen name cannot be empty")
                .max(100, "Screen name cannot exceed 100 characters")
                .optional(),
            totalSeats: z
                .coerce
                .number()
                .int("Total seats must be a whole number")
                .positive("Total seats must be greater than 0")
                .max(1000, "Total seats cannot exceed 1000")
                .optional(),
            isActive: z.boolean().optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field is required for update",
        }),
    params: z.object({
        screenId: z.string().uuid("Invalid screen ID"),
    }),
    query: z.object({}),
});

export {
    screenIdSchema,
    theaterIdParamSchema,
    createScreenSchema,
    updateScreenSchema,
};
