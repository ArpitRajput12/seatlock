import { z } from "zod";

const movieIdSchema = z.object({
    body: z.object({}),
    params: z.object({
        movieId: z.string().uuid("Invalid movie ID"),
    }),
    query: z.object({}),
});

const createMovieSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Movie title is required")
            .max(200, "Movie title cannot exceed 200 characters"),
        description: z
            .string()
            .trim()
            .max(2000, "Description cannot exceed 2000 characters")
            .optional(),
        durationMin: z
            .coerce
            .number()
            .int("Duration must be a whole number")
            .positive("Duration must be greater than 0")
            .max(600, "Duration cannot exceed 600 minutes"),
        language: z
            .string()
            .trim()
            .min(1, "Language is required")
            .max(50, "Language cannot exceed 50 characters"),
        genre: z
            .string()
            .trim()
            .min(1, "Genre is required")
            .max(100, "Genre cannot exceed 100 characters"),
        releaseDate: z.coerce.date().optional(),
        posterUrl: z.string().trim().url("Invalid poster URL").optional(),
        trailerUrl: z.string().trim().url("Invalid trailer URL").or(z.literal("")).optional(),
        trailer_url: z.string().trim().url("Invalid trailer URL").or(z.literal("")).optional(),
        isActive: z.boolean().optional(),
    }),
    params: z.object({}),
    query: z.object({}),
});

const updateMovieSchema = z.object({
    body: z
        .object({
            title: z
                .string()
                .trim()
                .min(1, "Movie title cannot be empty")
                .max(200, "Movie title cannot exceed 200 characters")
                .optional(),
            description: z
                .string()
                .trim()
                .max(2000, "Description cannot exceed 2000 characters")
                .optional(),
            durationMin: z
                .coerce
                .number()
                .int("Duration must be a whole number")
                .positive("Duration must be greater than 0")
                .max(600, "Duration cannot exceed 600 minutes")
                .optional(),
            language: z
                .string()
                .trim()
                .min(1, "Language cannot be empty")
                .max(50, "Language cannot exceed 50 characters")
                .optional(),
            genre: z
                .string()
                .trim()
                .min(1, "Genre cannot be empty")
                .max(100, "Genre cannot exceed 100 characters")
                .optional(),
            releaseDate: z.coerce.date().optional(),
            posterUrl: z.string().trim().url("Invalid poster URL").optional(),
            trailerUrl: z.string().trim().url("Invalid trailer URL").or(z.literal("")).optional(),
            trailer_url: z.string().trim().url("Invalid trailer URL").or(z.literal("")).optional(),
            isActive: z.boolean().optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: "At least one field is required for update",
        }),
    params: z.object({
        movieId: z.string().uuid("Invalid movie ID"),
    }),
    query: z.object({}),
});

const getMoviesSchema = z.object({
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
    movieIdSchema,
    createMovieSchema,
    updateMovieSchema,
    getMoviesSchema,
};
