import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import AppError from "../utils/AppError.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";

const uploadMediaAdmin = asyncHandler(async (req, res) => {
    const file = req.file;

    if (!file) {
        throw new AppError("No file uploaded. Please attach an image or video.", HTTP_STATUS.BAD_REQUEST);
    }

    const isVideo = file.mimetype.startsWith("video/") ||
        req.body?.isVideo === "true" ||
        req.body?.isVideo === true ||
        req.body?.type === "trailer" ||
        req.body?.folder === "trailers" ||
        req.body?.folder === "seatlock/trailers" ||
        Boolean(file.originalname?.match(/\.(mp4|webm|mkv|mov|avi)$/i));

    let folder = req.body?.folder;
    if (!folder) {
        if (isVideo || req.body?.type === "trailer") {
            folder = "seatlock/trailers";
        } else if (req.body?.type === "panorama") {
            folder = "seatlock/panoramas";
        } else {
            folder = "seatlock/posters";
        }
    }

    const result = await uploadToCloudinary(file.buffer, {
        mimetype: file.mimetype,
        original_filename: file.originalname,
        folder,
        isVideo,
        resource_type: isVideo ? "video" : "image",
    });

    const secureUrl = result.secure_url || result.secureUrl || result.url;
    const publicId = result.public_id || result.publicId;
    const resourceType = result.resource_type || (isVideo ? "video" : "image");

    return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        statusCode: HTTP_STATUS.CREATED,
        message: `${isVideo ? "Trailer video" : "Media"} uploaded successfully to Cloudinary`,
        url: secureUrl,
        public_id: publicId,
        publicId,
        resource_type: resourceType,
        resourceType,
        data: {
            url: secureUrl,
            secure_url: secureUrl,
            publicId,
            public_id: publicId,
            format: result.format,
            resourceType,
            resource_type: resourceType,
        },
    });
});

export { uploadMediaAdmin };
