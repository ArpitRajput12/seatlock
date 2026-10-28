const notFoundMiddleware = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);

    error.statusCode = 404;

    next(error);
};

const errorMiddleware = (err, req, res, next) => {
    console.error("Error:", err);

    let statusCode = err.statusCode;
    let message = err.message || "Internal Server Error";

    if (!statusCode) {
        if (err.code === "P2002" || err.code === "P2034" || err.code === "P2028") {
            statusCode = 409;
            message = "Concurrency conflict or lock contention detected. Please retry.";
        } else {
            statusCode = 500;
        }
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};

export {
    notFoundMiddleware,
    errorMiddleware,
};