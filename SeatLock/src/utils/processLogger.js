import logger from "../config/logger.js";

const registerProcessErrorHandlers = () => {
    process.on("uncaughtException", (error) => {
        if (
            error?.code === "ECONNREFUSED" ||
            String(error?.message).includes("6379") ||
            String(error).includes("ECONNREFUSED")
        ) {
            logger.warn(
                { error: error.message || error },
                "Suppressed Redis offline connection exception"
            );
            return;
        }

        logger.fatal({ error }, "Uncaught exception");
        process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
        if (
            reason?.code === "ECONNREFUSED" ||
            String(reason?.message).includes("6379") ||
            String(reason).includes("ECONNREFUSED")
        ) {
            logger.warn(
                { reason: reason?.message || reason },
                "Suppressed Redis offline connection rejection"
            );
            return;
        }

        logger.fatal({ reason }, "Unhandled promise rejection");
        process.exit(1);
    });
};

export default registerProcessErrorHandlers;
