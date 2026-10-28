import { z } from "zod";

const uuidNormalize = z.preprocess(
    (val) => (typeof val === "string" ? val.trim().replace(/\s+/g, "-") : val),
    z.string().uuid("Invalid show ID")
);

const showIdSchema = z.object({
    body: z.object({}),

    params: z.object({
        showId: uuidNormalize,
    }),

    query: z.object({}),
});

const createShowSchema = z.object({
    body: z.object({
        movieId: z.preprocess(
            (val) => (typeof val === "string" ? val.trim().replace(/\s+/g, "-") : val),
            z.string().uuid("Invalid movie ID")
        ),

        screenId: z.preprocess(
            (val) => (typeof val === "string" ? val.trim().replace(/\s+/g, "-") : val),
            z.string().uuid("Invalid screen ID")
        ),

        startTime: z.coerce.date({
            error: "Valid start time is required",
        }),

        endTime: z.coerce.date({
            error: "Valid end time is required",
        }),

        language: z
            .string()
            .trim()
            .min(1, "Language is required")
            .max(50, "Language cannot exceed 50 characters"),

        basePrice: z.coerce
            .number()
            .positive("Base price must be greater than 0")
            .max(100000, "Base price is too high"),

        isActive: z.boolean().optional(),
    })
    .refine(
        (data) => data.endTime > data.startTime,
        {
            message: "End time must be after start time",
            path: ["endTime"],
        }
    ),

    params: z.object({}),
    query: z.object({}),
});

const updateShowSchema = z.object({
    body: z.object({
        startTime: z.coerce.date().optional(),

        endTime: z.coerce.date().optional(),

        language: z
            .string()
            .trim()
            .min(1, "Language cannot be empty")
            .max(50, "Language cannot exceed 50 characters")
            .optional(),

        basePrice: z.coerce
            .number()
            .positive("Base price must be greater than 0")
            .max(100000, "Base price is too high")
            .optional(),

        isActive: z.boolean().optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required for update",
        }
    ),

    params: z.object({
        showId: uuidNormalize,
    }),

    query: z.object({}),
});

const getShowsSchema = z.object({
    body: z.object({}),

    params: z.object({}),

    query: z.object({
        movieId: z.preprocess(
            (val) => (typeof val === "string" ? val.trim().replace(/\s+/g, "-") : val),
            z.string().uuid("Invalid movie ID").optional()
        ),

        screenId: z.preprocess(
            (val) => (typeof val === "string" ? val.trim().replace(/\s+/g, "-") : val),
            z.string().uuid("Invalid screen ID").optional()
        ),

        from: z.coerce.date().optional(),

        to: z.coerce.date().optional(),
    }),
});

export {
    showIdSchema,
    createShowSchema,
    updateShowSchema,
    getShowsSchema,
};
