import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError(
                "Authentication required",
                HTTP_STATUS.UNAUTHORIZED
            );
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError(
                "You do not have permission to perform this action",
                HTTP_STATUS.FORBIDDEN
            );
        }

        next();
    };
};

export default authorizeRoles;