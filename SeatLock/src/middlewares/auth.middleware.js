import { verifyAccessToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const authMiddleware = (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        throw new AppError(
            "Authentication token is required",
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        throw new AppError(
            "Invalid authorization format. Use Bearer token",
            HTTP_STATUS.UNAUTHORIZED
        );
    }

    const payload = verifyAccessToken(token);

    req.user = {
        id: payload.userId,
        role: payload.role,
    };

    next();
};

export default authMiddleware;
