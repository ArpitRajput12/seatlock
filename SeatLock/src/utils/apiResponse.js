const sendSuccess = (
    res,
    {
        statusCode = 200,
        message = "Success",
        data = null,
        meta = null,
    } = {}
) => {
    const response = {
        success: true,
        message,
        data,
    };

    if (meta !== null) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
};

const sendError = (
    res,
    {
        statusCode = 500,
        message = "Internal Server Error",
        details = null,
    } = {}
) => {
    const response = {
        success: false,
        message,
    };

    if (details !== null) {
        response.details = details;
    }

    return res.status(statusCode).json(response);
};

export {
    sendSuccess,
    sendError,
};