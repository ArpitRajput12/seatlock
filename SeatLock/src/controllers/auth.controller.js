import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshUserToken,
    getCurrentUser,
} from "../services/auth.service.js";

const register = asyncHandler(async (req, res) => {
    const payload = req.validated?.body || req.body;
    const user = await registerUser(payload);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "User registered successfully",
        data: { user },
    });
});

const login = asyncHandler(async (req, res) => {
    const credentials = req.validated?.body || req.body;
    const result = await loginUser(credentials);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Login successful",
        data: result,
    });
});

const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.validated?.body || req.body || {};
    await logoutUser(req.user.id, refreshToken);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Logout successful",
    });
});

const refreshToken = asyncHandler(async (req, res) => {
    const token = (req.validated?.body || req.body)?.refreshToken;
    const result = await refreshUserToken(token);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Access token refreshed successfully",
        data: result,
    });
});

const currentUser = asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req.user.id);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Current user fetched successfully",
        data: { user },
    });
});

export {
    register,
    login,
    logout,
    refreshToken,
    currentUser,
};
