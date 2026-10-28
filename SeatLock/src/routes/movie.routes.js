import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import {
    createMovie,
    getAllMovies,
    getMovie,
    updateMovie,
    deleteMovie,
} from "../controllers/movie.controller.js";
import {
    movieIdSchema,
    createMovieSchema,
    updateMovieSchema,
    getMoviesSchema,
} from "../validations/movie.validation.js";

const router = Router();

// Public catalog routes
router.get("/", validate(getMoviesSchema), getAllMovies);
router.get("/:movieId", validate(movieIdSchema), getMovie);

// Admin movie management
router.post(
    "/",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(createMovieSchema),
    createMovie
);

router.patch(
    "/:movieId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(updateMovieSchema),
    updateMovie
);

router.delete(
    "/:movieId",
    authMiddleware,
    authorizeRoles("ADMIN"),
    validate(movieIdSchema),
    deleteMovie
);

export default router;
