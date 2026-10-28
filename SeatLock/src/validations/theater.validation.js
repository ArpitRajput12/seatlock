import { z } from "zod";

const theaterIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        theaterId: z.string().uuid("Invalid theater ID"),
    }),
    query: z.object({}),
});

const createTheaterSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(1, "Theater name is required")
            .max(200, "Theater name cannot exceed 200 characters"),
        address: z
            .string()
            .trim()
            .min(1, "Address is required")
            .max(500, "Address cannot exceed 500 characters"),
        city: z
            .string()
            .trim()
            .min(1, "City is required")
            .max(100, "City cannot exceed 100 characters"),
        state: z
            .string()
            .trim()
            .min(1, "State is required")
            .max(100, "State cannot exceed 100 characters"),
        isActive: z.boolean().optional(),
    }),
    params: z.object({}),
    query: z.object({}),
});

const updateTheaterSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(1, "Theater name cannot be empty")
                .max(200, "Theater name cannot exceed 200 characters")
                .optional(),
            address: z
                .string()
                .trim()
                .min(1, "Address cannot be empty")
                .max(500, "Address cannot exceed 500 characters")
                .optional(),
            city: z
                .string()
                .trim()
                .min(1, "City cannot be empty")
                .max(100, "City cannot exceed 100 characters")
                .optional(),
            state: z
                .string()
                .trim()
                .min(1, "State cannot be empty")
                .max(100, "State cannot exceed 100 characters")
                .optional(),
            isActive: z.boolean().optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field is required for update",
        }),
    params: z.object({
        theaterId: z.string().uuid("Invalid theater ID"),
    }),
    query: z.object({}),
});

const getTheatersSchema = z.object({
    body: z.object({}),
    params: z.object({}),
    query: z.object({
        page: z
            .coerce
            .number()
            .int("Page must be a whole number")
            .positive("Page must be greater than 0")
            .optional(),
        limit: z
            .coerce
            .number()
            .int("Limit must be a whole number")
            .positive("Limit must be greater than 0")
            .max(100, "Limit cannot exceed 100")
            .optional(),
        search: z
            .string()
            .trim()
            .max(100, "Search cannot exceed 100 characters")
            .optional(),
        city: z
            .string()
            .trim()
            .max(100, "City cannot exceed 100 characters")
            .optional(),
        isActive: z
            .preprocess((val) => {
                if (val === "true" || val === true) return true;
                if (val === "false" || val === false) return false;
                return undefined;
            }, z.boolean().optional())
            .optional(),
    }),
});

export {
    theaterIdSchema,
    createTheaterSchema,
    updateTheaterSchema,
    getTheatersSchema,
};
