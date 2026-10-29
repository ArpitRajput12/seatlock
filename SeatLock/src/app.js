import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import correlationMiddleware from "./middlewares/correlation.middleware.js";
import requestLoggerMiddleware from "./middlewares/requestLogger.middleware.js";
import errorLoggerMiddleware from "./middlewares/errorLogger.middleware.js";
import {
    notFoundMiddleware,
    errorMiddleware,
} from "./middlewares/error.middleware.js";

const app = express();

// Security headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// CORS configuration
const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://seatlock-3hnq5fhki-arpitrajput12.vercel.app",
    "https://seatlock-arpitrajput12.vercel.app",
];

const parseAllowedOrigins = (origins) => {
    const list = [...defaultOrigins];
    if (origins) {
        const parsed = Array.isArray(origins)
            ? origins
            : String(origins)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        list.push(...parsed);
    }
    return list;
};

const allowedOrigins = parseAllowedOrigins(env.corsOrigins);

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    // Allow localhost and 127.0.0.1 on any port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
    // Allow any Vercel production or preview deployment: *.vercel.app
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
    // Allow Render deployment hosts
    if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return true;
    return false;
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
        "Content-Type",
        "content-type",
        "Authorization",
        "authorization",
        "Idempotency-Key",
        "idempotency-key",
        "X-Correlation-ID",
        "x-correlation-id",
        "Accept",
        "accept",
        "Origin",
        "origin",
        "X-Requested-With",
        "x-requested-with",
    ],
    exposedHeaders: ["X-Correlation-ID", "Idempotency-Key"],
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

// Request tracing and logging
app.use(correlationMiddleware);
app.use(requestLoggerMiddleware);

// Body parsing
app.use(express.json());

// API routes
app.use("/api/v1", apiRoutes);
app.use("/", apiRoutes);

// Error handling pipeline
app.use(notFoundMiddleware);
app.use(errorLoggerMiddleware);
app.use(errorMiddleware);

export default app;
