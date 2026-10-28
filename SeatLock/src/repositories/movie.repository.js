import prisma from "../config/db.js";

const createMovie = async (movieData) => {
    return prisma.movie.create({
        data: movieData,
    });
};

const findMovieById = async (movieId) => {
    return prisma.movie.findUnique({
        where: { id: movieId },
    });
};

const findActiveMovieById = async (movieId) => {
    return prisma.movie.findFirst({
        where: {
            id: movieId,
            isActive: true,
        },
    });
};

const findMovies = async ({ skip, take, search, isActive }) => {
    const where = {};

    if (isActive !== undefined) {
        where.isActive = isActive;
    } else {
        where.isActive = true;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { genre: { contains: search, mode: "insensitive" } },
            { language: { contains: search, mode: "insensitive" } },
        ];
    }

    const [movies, total] = await prisma.$transaction([
        prisma.movie.findMany({
            where,
            orderBy: { releaseDate: "desc" },
            skip,
            take,
        }),
        prisma.movie.count({ where }),
    ]);

    return {
        movies,
        total,
    };
};

const updateMovie = async (movieId, movieData) => {
    return prisma.movie.update({
        where: { id: movieId },
        data: movieData,
    });
};

const deactivateMovie = async (movieId) => {
    return prisma.movie.update({
        where: { id: movieId },
        data: { isActive: false },
    });
};

export {
    createMovie,
    findMovieById,
    findActiveMovieById,
    findMovies,
    updateMovie,
    deactivateMovie,
};
