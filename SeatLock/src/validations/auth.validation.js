import { z } from "zod";

const registerSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name cannot exceed 100 characters"),
        email: z
            .string()
            .trim()
            .email("Please provide a valid email address")
            .toLowerCase(),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(100, "Password cannot exceed 100 characters"),
    }),
    params: z.object({}),
    query: z.object({}),
});

const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .email("Please provide a valid email address")
            .toLowerCase(),
        password: z
            .string()
            .min(1, "Password is required"),
    }),
    params: z.object({}),
    query: z.object({}),
});

const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z
            .string()
            .min(1, "Refresh token is required"),
    }),
    params: z.object({}),
    query: z.object({}),
});

const logoutSchema = z.object({
    body: z.object({
        refreshToken: z
            .string()
            .min(1, "Refresh token is required"),
    }),
    params: z.object({}),
    query: z.object({}),
});

export {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    logoutSchema,
};
