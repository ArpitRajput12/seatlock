import logger from "../config/logger.js";


const requestLoggerMiddleware = (
    req,
    res,
    next
) => {

    const startTime = process.hrtime.bigint();


    res.on("finish", () => {

        const endTime =
            process.hrtime.bigint();


        const durationMs =
            Number(endTime - startTime) / 1_000_000;


        const correlationId =
            req.correlationId ||
            req.id ||
            "unknown";


        const logData = {

            correlationId,

            method: req.method,

            path: req.originalUrl,

            statusCode: res.statusCode,

            durationMs:
                Number(durationMs.toFixed(2)),

            userId:
                req.user?.id || null,

            ip:
                req.ip,

        };


        if (res.statusCode >= 500) {

            logger.error(
                logData,
                "HTTP request failed"
            );

        } else if (res.statusCode >= 400) {

            logger.warn(
                logData,
                "HTTP request returned client error"
            );

        } else {

            logger.info(
                logData,
                "HTTP request completed"
            );
        }
    });


    next();
};


export default requestLoggerMiddleware;