import { v2 as cloudinary } from "cloudinary";
import env from "../config/env.js";
import logger from "../config/logger.js";

// Setup Cloudinary SDK using .env variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || env.cloudinary?.cloudName,
    api_key: process.env.CLOUDINARY_API_KEY || env.cloudinary?.apiKey,
    api_secret: process.env.CLOUDINARY_API_SECRET || env.cloudinary?.apiSecret,
    secure: true,
});

/**
 * Uploads a buffer directly to Cloudinary using upload_stream
 * Supports both video trailers and image posters/panoramas.
 * Falls back to local data URI simulation if mock/placeholder credentials are provided.
 */
const uploadToCloudinary = async (fileBuffer, optionsOrIsVideo = false) => {
    const isVideo = typeof optionsOrIsVideo === "boolean"
        ? optionsOrIsVideo
        : Boolean(
            optionsOrIsVideo?.isVideo ||
            optionsOrIsVideo?.resource_type === "video" ||
            optionsOrIsVideo?.mimetype?.startsWith("video/") ||
            optionsOrIsVideo?.original_filename?.match(/\.(mp4|webm|mkv|mov|avi)$/i)
        );

    const options = typeof optionsOrIsVideo === "object" && optionsOrIsVideo !== null ? optionsOrIsVideo : {};

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || env.cloudinary?.cloudName;
    const apiKey = process.env.CLOUDINARY_API_KEY || env.cloudinary?.apiKey;
    const isMock = !cloudName || cloudName === "your_cloud_name" || !apiKey || apiKey === "your_api_key";

    let targetFolder = options.folder;
    if (!targetFolder) {
        targetFolder = isVideo ? "seatlock/trailers" : "seatlock/posters";
    } else if (!targetFolder.startsWith("seatlock")) {
        targetFolder = `seatlock/${targetFolder}`;
    }

    const resourceType = isVideo ? "video" : (options.resource_type || "image");

    if (isMock) {
        logger.info("Using simulated Cloudinary upload (mock credentials provided in .env)");
        const base64Data = fileBuffer.toString("base64");
        const mimeType = options.mimetype || (isVideo ? "video/mp4" : "image/jpeg");
        const dataUri = `data:${mimeType};base64,${base64Data}`;
        const mockPublicId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        return {
            success: true,
            url: dataUri,
            secure_url: dataUri,
            secureUrl: dataUri,
            public_id: mockPublicId,
            publicId: mockPublicId,
            format: mimeType.split("/")[1] || (isVideo ? "mp4" : "jpeg"),
            resource_type: isVideo ? "video" : "image",
            resourceType: isVideo ? "video" : "image",
        };
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: targetFolder,
                resource_type: resourceType,
                ...options,
            },
            (error, result) => {
                if (error) {
                    logger.error({ error }, "Cloudinary upload error");
                    return reject(error);
                }
                resolve({
                    success: true,
                    url: result.secure_url,
                    secure_url: result.secure_url,
                    secureUrl: result.secure_url,
                    public_id: result.public_id,
                    publicId: result.public_id,
                    format: result.format,
                    resource_type: result.resource_type,
                    resourceType: result.resource_type,
                });
            }
        );

        uploadStream.end(fileBuffer);
    });
};

export { cloudinary, uploadToCloudinary };
export default uploadToCloudinary;

