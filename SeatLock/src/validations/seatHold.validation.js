import { z } from "zod";

const uuidNormalize = z.preprocess(
    (val) => (typeof val === "string" ? val.trim().replace(/\s+/g, "-") : val),
    z.string().min(1, "Show ID is required")
);

const seatIdentifierNormalize = z.preprocess(
    (val) => (typeof val === "string" ? val.trim().replace(/\s+/g, "-") : val),
    z.string().min(1, "Seat identifier cannot be empty")
);

const holdSeatsSchema = z
    .object({
        params: z
            .object({
                id: uuidNormalize.optional(),
                showId: uuidNormalize.optional(),
            })
            .optional()
            .default({}),

        body: z
            .object({
                showId: uuidNormalize.optional(),
                seatIds: z.array(seatIdentifierNormalize).optional(),
                showSeatIds: z.array(seatIdentifierNormalize).optional(),
                strategy: z
                    .enum(["PESSIMISTIC", "OPTIMISTIC", "REDLOCK"])
                    .optional()
                    .default("PESSIMISTIC"),
            })
            .refine(
                (data) =>
                    (data.seatIds && data.seatIds.length > 0) ||
                    (data.showSeatIds && data.showSeatIds.length > 0),
                {
                    message: "At least one seat ID or showSeat ID must be provided",
                    path: ["seatIds"],
                }
            ),

        query: z.object({}).optional().default({}),
    })
    .refine(
        (data) =>
            Boolean(
                data.params?.id ||
                data.params?.showId ||
                data.body?.showId
            ),
        {
            message: "Valid show ID is required in route params or body",
            path: ["params", "showId"],
        }
    );

const releaseSeatsSchema = z
    .object({
        params: z
            .object({
                id: uuidNormalize.optional(),
                showId: uuidNormalize.optional(),
            })
            .optional()
            .default({}),

        body: z
            .object({
                showId: uuidNormalize.optional(),
                holdToken: z.string().min(1, "Hold token cannot be empty").optional(),
                bookingId: uuidNormalize.optional(),
                seatIds: z.array(seatIdentifierNormalize).optional(),
                showSeatIds: z.array(seatIdentifierNormalize).optional(),
            })
            .refine(
                (data) =>
                    Boolean(
                        data.holdToken ||
                        data.bookingId ||
                        (data.seatIds && data.seatIds.length > 0) ||
                        (data.showSeatIds && data.showSeatIds.length > 0)
                    ),
                {
                    message:
                        "At least one of holdToken, bookingId, seatIds, or showSeatIds must be provided",
                    path: ["holdToken"],
                }
            ),

        query: z.object({}).optional().default({}),
    })
    .refine(
        (data) =>
            Boolean(
                data.params?.id ||
                data.params?.showId ||
                data.body?.showId ||
                data.body?.holdToken ||
                data.body?.bookingId
            ),
        {
            message: "Valid show ID or token is required",
            path: ["params", "showId"],
        }
    );

export {
    holdSeatsSchema,
    releaseSeatsSchema,
};
