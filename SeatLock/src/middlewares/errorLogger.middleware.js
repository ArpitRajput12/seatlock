import logger from "../config/logger.js";


const errorLoggerMiddleware = (
    err,
    req,
    res,
    next
) => {

    const correlationId =
        req.correlationId ||
        req.id ||
        "unknown";


    logger.error(
        {
            correlationId,

            method: req.method,

            path: req.originalUrl,

            statusCode:
                err.statusCode || 500,

            userId:
                req.user?.id || null,

            ip:
                req.ip,

            error: err,
        },

        "Request error"
    );


    // Existing error middleware will
    // generate the actual API response.

    next(err);
};


export default errorLoggerMiddleware;