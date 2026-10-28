import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const env = {
    port: Number(process.env.PORT) || 8000,
    nodeEnv: process.env.NODE_ENV || "development",

    databaseUrl: process.env.DATABASE_URL,

    redisUrl:
        process.env.REDIS_URL ||
        "redis://localhost:6379",

    corsOrigins:
        process.env.CORS_ORIGINS ||
        "http://localhost:5173",

    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_YourTestKeyIdHere",
        keySecret: process.env.RAZORPAY_KEY_SECRET || "YourTestKeySecretHere",
    },

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "your_cloud_name",
        apiKey: process.env.CLOUDINARY_API_KEY || "your_api_key",
        apiSecret: process.env.CLOUDINARY_API_SECRET || "your_api_secret",
    },

    jwt: {
        accessSecret:
            process.env.JWT_ACCESS_SECRET ||
            process.env.JWT_SECRET ||
            "QQFahve5dJj1VOWYckRxQn0kde0BjKrV9iEMdSsp5hi",

        refreshSecret:
            process.env.JWT_REFRESH_SECRET ||
            process.env.REFRESH_TOKEN_SECRET ||
            "kX35T0651KV4jkzVfHspmtCxQoEV5BedJEnWO6yd2qq",

        accessExpiresIn:
            process.env.JWT_ACCESS_EXPIRES_IN ||
            process.env.JWT_EXPIRES_IN ||
            "1d",

        refreshExpiresIn:
            process.env.JWT_REFRESH_EXPIRES_IN ||
            process.env.REFRESH_TOKEN_EXPIRES_IN ||
            "7d",
    },

    theaters: {
        theater1: {
            email: process.env.THEATER_1_EMAIL || "admin.pacific@seatlock.com",
            password: process.env.THEATER_1_PASSWORD || "PacificCinema2026!",
        },
        theater2: {
            email: process.env.THEATER_2_EMAIL || "admin.ambience@seatlock.com",
            password: process.env.THEATER_2_PASSWORD || "AmbienceCinema2026!",
        },
        theater3: {
            email: process.env.THEATER_3_EMAIL || "admin.palassio@seatlock.com",
            password: process.env.THEATER_3_PASSWORD || "PalassioCinema2026!",
        },
    },
};

export default env;
