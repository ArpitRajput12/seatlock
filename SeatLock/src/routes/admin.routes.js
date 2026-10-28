import { Router } from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";

import {
    createTheaterAdmin,
    getTheatersAdmin,
    updateTheaterAdmin,
    deleteTheaterAdmin,
    createScreenWithLayout,
    updateScreenSeats,
    getScreenWithSeatsAdmin,
    scheduleShowAdmin,
    getAdminStats,
    getMoviesAdmin,
    createMovieAdmin,
    updateMovieAdmin,
    deleteMovieAdmin,
    getShowsAdmin,
    cancelShowAdmin,
    getRecentBookingsAdmin,
} from "../controllers/adminManagement.controller.js";

import { uploadMediaAdmin } from "../controllers/upload.controller.js";

const router = Router();

// Protect all admin routes with authentication & ADMIN role
router.use(authMiddleware);
router.use(authorizeRoles("ADMIN"));

// Media Upload (Cloudinary) - Accept any field name ('file', 'image', etc.)
router.post(
    "/upload",
    upload.any(),
    (req, res, next) => {
        if (!req.file && req.files && req.files.length > 0) {
            req.file = req.files[0];
        }
        next();
    },
    uploadMediaAdmin
);

// Analytics / Stats
router.get("/stats", getAdminStats);
router.get("/bookings", getRecentBookingsAdmin);

// Movies CRUD
router.get("/movies", getMoviesAdmin);
router.post("/movies", createMovieAdmin);
router.put("/movies/:id", updateMovieAdmin);
router.patch("/movies/:id", updateMovieAdmin);
router.delete("/movies/:id", deleteMovieAdmin);

// Theaters
router.get("/theaters", getTheatersAdmin);
router.post("/theaters", createTheaterAdmin);
router.put("/theaters/:id", updateTheaterAdmin);
router.patch("/theaters/:id", updateTheaterAdmin);
router.delete("/theaters/:id", deleteTheaterAdmin);

// Screens & Dynamic Seats
router.post("/theaters/:theaterId/screens", createScreenWithLayout);
router.get("/screens/:screenId", getScreenWithSeatsAdmin);
router.put("/screens/:screenId/seats", updateScreenSeats);

// Shows
router.get("/shows", getShowsAdmin);
router.post("/shows", scheduleShowAdmin);
router.delete("/shows/:id", cancelShowAdmin);

export default router;
