import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit for video trailers and media assets
    },
    fileFilter: (req, file, cb) => {
        const allowedVideoMimes = [
            "video/mp4",
            "video/webm",
            "video/mkv",
            "video/x-matroska",
            "video/quicktime",
            "video/x-msvideo",
            "video/avi",
        ];

        if (
            file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("video/") ||
            allowedVideoMimes.includes(file.mimetype) ||
            Boolean(file.originalname?.match(/\.(mp4|webm|mkv|mov|avi|jpg|jpeg|png|webp)$/i))
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only image and video uploads are permitted"), false);
        }
    },
});

export default upload;

