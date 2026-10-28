import pino from "pino";


const logger = pino({
    level: process.env.LOG_LEVEL || "info",

    base: {
        service: "seatlock-api",
        environment:
            process.env.NODE_ENV || "development",
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    serializers: {
        err: pino.stdSerializers.err,
    },
});


export default logger;