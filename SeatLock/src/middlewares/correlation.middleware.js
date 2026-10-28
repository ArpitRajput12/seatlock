import crypto from "crypto";

const correlationMiddleware = (req, res, next) => {
    const incomingId = req.headers["x-correlation-id"];

    const correlationId =
        typeof incomingId === "string" && incomingId.trim()
            ? incomingId.trim()
            : crypto.randomUUID();

    req.correlationId = correlationId;

    res.setHeader("X-Correlation-ID", correlationId);

    next();
};

export default correlationMiddleware;