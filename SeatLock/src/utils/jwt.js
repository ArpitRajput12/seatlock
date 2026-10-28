import jwt from "jsonwebtoken";
import env from "../config/env.js";
import AppError from "./AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const generateAccessToken = (payload) => {
    return jwt.sign(payload, env.jwt.accessSecret, {
        expiresIn: env.jwt.accessExpiresIn,
    });
};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, env.jwt.refreshSecret, {
        expiresIn: env.jwt.refreshExpiresIn,
    });
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, env.jwt.accessSecret);
    } catch {
        throw new AppError(
            "Invalid or expired access token",
            HTTP_STATUS.UNAUTHORIZED
        );
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, env.jwt.refreshSecret);
    } catch {
        throw new AppError(
            "Invalid or expired refresh token",
            HTTP_STATUS.UNAUTHORIZED
        );
    }
};

export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
