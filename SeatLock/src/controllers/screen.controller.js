import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
    createScreenService,
    getScreenById,
    getScreensByTheater,
    updateScreenService,
    deleteScreenService,
} from "../services/screen.service.js";

const createScreen = asyncHandler(async (req, res) => {
    const screen = await createScreenService(req.validated.body);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Screen created successfully",
        data: { screen },
    });
});

const getScreen = asyncHandler(async (req, res) => {
    const screen = await getScreenById(req.validated.params.screenId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Screen fetched successfully",
        data: { screen },
    });
});

const getTheaterScreens = asyncHandler(async (req, res) => {
    const screens = await getScreensByTheater(req.validated.params.theaterId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Screens fetched successfully",
        data: screens,
    });
});

const updateScreen = asyncHandler(async (req, res) => {
    const screen = await updateScreenService(
        req.validated.params.screenId,
        req.validated.body
    );

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Screen updated successfully",
        data: { screen },
    });
});

const deleteScreen = asyncHandler(async (req, res) => {
    const screen = await deleteScreenService(req.validated.params.screenId);

    return sendSuccess(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Screen deleted successfully",
        data: { screen },
    });
});

export {
    createScreen,
    getScreen,
    getTheaterScreens,
    updateScreen,
    deleteScreen,
};
