import prisma from "../config/db.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const ROW_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * 1. Theaters / Halls Management
 */
const createTheaterAdminService = async ({ name, city, state = "", address = "" }) => {
    if (!name || !city) {
        throw new AppError("Theater name and city are required", HTTP_STATUS.BAD_REQUEST);
    }

    const theater = await prisma.theater.create({
        data: {
            name: name.trim(),
            city: city.trim(),
            state: state.trim(),
            address: address.trim(),
            isActive: true,
        },
    });

    return theater;
};

const getTheatersAdminService = async () => {
    const theaters = await prisma.theater.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            screens: {
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    totalSeats: true,
                    isActive: true,
                },
            },
        },
    });

    return theaters;
};

const updateTheaterAdminService = async (theaterId, data) => {
    const existing = await prisma.theater.findUnique({
        where: { id: theaterId },
    });

    if (!existing) {
        throw new AppError("Theater not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await prisma.theater.update({
        where: { id: theaterId },
        data: {
            ...(data.name && { name: data.name.trim() }),
            ...(data.city && { city: data.city.trim() }),
            ...(data.state !== undefined && { state: data.state.trim() }),
            ...(data.address !== undefined && { address: data.address.trim() }),
            ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        },
    });

    return updated;
};

const deleteTheaterAdminService = async (theaterId) => {
    const existing = await prisma.theater.findUnique({
        where: { id: theaterId },
    });

    if (!existing) {
        throw new AppError("Theater not found", HTTP_STATUS.NOT_FOUND);
    }

    const deactivated = await prisma.theater.update({
        where: { id: theaterId },
        data: { isActive: false },
    });

    return deactivated;
};

/**
 * 2. Screens & Dynamic Seats Layout Generator
 */
const createScreenWithLayoutService = async (
    theaterId,
    { name, total_rows, total_columns, rows, seatsPerRow, rowCategories = {} }
) => {
    const theater = await prisma.theater.findFirst({
        where: { id: theaterId, isActive: true },
    });

    if (!theater) {
        throw new AppError("Theater not found or inactive", HTTP_STATUS.NOT_FOUND);
    }

    const rowsCount = Math.min(Math.max(Number(total_rows || rows) || 6, 1), 26);
    const colsCount = Math.min(Math.max(Number(total_columns || seatsPerRow) || 10, 1), 30);
    const screenName = name ? name.trim() : `Screen ${Date.now().toString().slice(-4)}`;

    const getRowCategory = (rowLabel, r) => {
        if (rowCategories[rowLabel]) return rowCategories[rowLabel];
        if (Array.isArray(rowCategories.RECLINER) && rowCategories.RECLINER.includes(rowLabel)) return "RECLINER";
        if (Array.isArray(rowCategories.PREMIUM) && rowCategories.PREMIUM.includes(rowLabel)) return "PREMIUM";
        if (Array.isArray(rowCategories.REGULAR) && rowCategories.REGULAR.includes(rowLabel)) return "REGULAR";
        if (r === rowsCount - 1 && rowsCount >= 4) return "RECLINER";
        if (r >= Math.floor(rowsCount / 2)) return "PREMIUM";
        return "REGULAR";
    };

    return prisma.$transaction(async (tx) => {
        const screen = await tx.screen.create({
            data: {
                theaterId,
                name: screenName,
                totalSeats: rowsCount * colsCount,
                isActive: true,
            },
        });

        const seatsToCreate = [];

        for (let r = 0; r < rowsCount; r++) {
            const rowLabel = ROW_LETTERS[r];
            const defaultType = getRowCategory(rowLabel, r);

            for (let c = 1; c <= colsCount; c++) {
                seatsToCreate.push({
                    screenId: screen.id,
                    rowLabel,
                    seatNumber: c,
                    seatType: defaultType,
                });
            }
        }

        await tx.seat.createMany({
            data: seatsToCreate,
        });

        const fullScreen = await tx.screen.findUnique({
            where: { id: screen.id },
            include: {
                seats: {
                    orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
                },
            },
        });

        return fullScreen;
    });
};

const updateScreenSeatsService = async (screenId, { total_rows, total_columns, rows, seatsPerRow, seatUpdates = [], rowCategories = {} }) => {
    const screen = await prisma.screen.findUnique({
        where: { id: screenId },
        include: { seats: true },
    });

    if (!screen) {
        throw new AppError("Screen not found", HTTP_STATUS.NOT_FOUND);
    }

    return prisma.$transaction(async (tx) => {
        // If row/column resizing requested
        const targetRows = total_rows || rows;
        const targetCols = total_columns || seatsPerRow;

        if (targetRows && targetCols) {
            const newRowsCount = Math.min(Math.max(Number(targetRows), 1), 26);
            const newColsCount = Math.min(Math.max(Number(targetCols), 1), 30);

            // Fetch existing seats map
            const existingSeats = await tx.seat.findMany({
                where: { screenId },
            });
            const existingMap = new Map();
            for (const s of existingSeats) {
                existingMap.set(`${s.rowLabel}_${s.seatNumber}`, s);
            }

            const getRowCategory = (rowLabel, r) => {
                if (rowCategories[rowLabel]) return rowCategories[rowLabel];
                if (Array.isArray(rowCategories.RECLINER) && rowCategories.RECLINER.includes(rowLabel)) return "RECLINER";
                if (Array.isArray(rowCategories.PREMIUM) && rowCategories.PREMIUM.includes(rowLabel)) return "PREMIUM";
                if (Array.isArray(rowCategories.REGULAR) && rowCategories.REGULAR.includes(rowLabel)) return "REGULAR";
                if (r === newRowsCount - 1 && newRowsCount >= 4) return "RECLINER";
                if (r >= Math.floor(newRowsCount / 2)) return "PREMIUM";
                return "REGULAR";
            };

            const newSeats = [];
            for (let r = 0; r < newRowsCount; r++) {
                const rowLabel = ROW_LETTERS[r];
                const category = getRowCategory(rowLabel, r);

                for (let c = 1; c <= newColsCount; c++) {
                    const key = `${rowLabel}_${c}`;
                    if (!existingMap.has(key)) {
                        newSeats.push({
                            screenId,
                            rowLabel,
                            seatNumber: c,
                            seatType: category,
                        });
                    }
                }
            }

            if (newSeats.length > 0) {
                await tx.seat.createMany({
                    data: newSeats,
                });
            }

            const updatedCount = await tx.seat.count({ where: { screenId } });
            await tx.screen.update({
                where: { id: screenId },
                data: { totalSeats: updatedCount },
            });
        }

        // Apply individual seat type changes
        if (Array.isArray(seatUpdates) && seatUpdates.length > 0) {
            for (const update of seatUpdates) {
                if (update.seatId && update.seatType) {
                    await tx.seat.updateMany({
                        where: { id: update.seatId, screenId },
                        data: { seatType: update.seatType },
                    });
                }
            }
        }

        return tx.screen.findUnique({
            where: { id: screenId },
            include: {
                seats: {
                    orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
                },
            },
        });
    });
};

const getScreenWithSeatsAdminService = async (screenId) => {
    const screen = await prisma.screen.findUnique({
        where: { id: screenId },
        include: {
            theater: true,
            seats: {
                orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
            },
            shows: {
                where: { isActive: true },
                include: { movie: true },
                orderBy: { startTime: "asc" },
            },
        },
    });

    if (!screen) {
        throw new AppError("Screen not found", HTTP_STATUS.NOT_FOUND);
    }

    return screen;
};

/**
 * 3. Shows Scheduling & Auto Provisioning ShowSeats
 */
const scheduleShowAdminService = async ({
    movieId,
    screenId,
    startTime,
    endTime,
    language = "Hindi",
    basePrice = 250,
    tierPricing = {},
}) => {
    const movie = await prisma.movie.findFirst({
        where: { id: movieId, isActive: true },
    });

    if (!movie) {
        throw new AppError("Movie not found or inactive", HTTP_STATUS.NOT_FOUND);
    }

    const screen = await prisma.screen.findFirst({
        where: { id: screenId, isActive: true },
        include: { seats: true },
    });

    if (!screen) {
        throw new AppError("Screen not found or inactive", HTTP_STATUS.NOT_FOUND);
    }

    if (!screen.seats || screen.seats.length === 0) {
        throw new AppError(
            "Screen has no seats configured. Please add seats before scheduling a show.",
            HTTP_STATUS.BAD_REQUEST
        );
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
        throw new AppError("Invalid startTime format", HTTP_STATUS.BAD_REQUEST);
    }

    let end;
    if (endTime) {
        end = new Date(endTime);
    } else {
        // Automatically calculate: startTime + movie duration + 20 minutes intermission/cleanup
        end = new Date(start.getTime() + (movie.durationMin + 20) * 60 * 1000);
    }

    const parsedBasePrice = Number(basePrice) || 250;

    return prisma.$transaction(async (tx) => {
        const show = await tx.show.create({
            data: {
                movieId,
                screenId,
                startTime: start,
                endTime: end,
                language: language.trim(),
                basePrice: parsedBasePrice,
                isActive: true,
            },
        });

        // Price calculator by seat category
        const getSeatPrice = (seatType) => {
            if (tierPricing[seatType] !== undefined && Number(tierPricing[seatType]) > 0) {
                return Number(tierPricing[seatType]);
            }
            if (seatType === "RECLINER") {
                return Math.round(parsedBasePrice * 1.8);
            }
            if (seatType === "PREMIUM") {
                return Math.round(parsedBasePrice * 1.3);
            }
            return parsedBasePrice;
        };

        const showSeatsData = screen.seats.map((seat) => ({
            showId: show.id,
            seatId: seat.id,
            status: "AVAILABLE",
            price: getSeatPrice(seat.seatType),
            version: 0,
        }));

        await tx.showSeat.createMany({
            data: showSeatsData,
        });

        const showWithDetails = await tx.show.findUnique({
            where: { id: show.id },
            include: {
                movie: true,
                screen: {
                    include: { theater: true },
                },
                _count: {
                    select: { showSeats: true },
                },
            },
        });

        return showWithDetails;
    });
};

/**
 * 4. High-Level Admin Analytics & Occupancy
 */
const getAdminStatsService = async () => {
    const [
        totalMovies,
        totalTheaters,
        totalScreens,
        totalShows,
        totalBookings,
        confirmedBookings,
        revenueAggregate,
        totalShowSeats,
        bookedShowSeats,
    ] = await Promise.all([
        prisma.movie.count({ where: { isActive: true } }),
        prisma.theater.count({ where: { isActive: true } }),
        prisma.screen.count({ where: { isActive: true } }),
        prisma.show.count({ where: { isActive: true } }),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "CONFIRMED" } }),
        prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: "SUCCEEDED" },
        }),
        prisma.showSeat.count(),
        prisma.showSeat.count({ where: { status: "BOOKED" } }),
    ]);

    const totalRevenue = Number(revenueAggregate._sum.amount || 0);
    const occupancyRate = totalShowSeats > 0 ? ((bookedShowSeats / totalShowSeats) * 100).toFixed(1) : 0;

    return {
        catalog: {
            totalMovies,
            totalTheaters,
            totalScreens,
            totalShows,
        },
        bookings: {
            total: totalBookings,
            confirmed: confirmedBookings,
            occupancyRate: `${occupancyRate}%`,
        },
        financials: {
            totalRevenue,
            currency: "INR",
        },
        // Flattened properties for direct access
        totalRevenue,
        totalBookings,
        confirmedBookings,
        activeShows: totalShows,
        occupancyRate: Number(occupancyRate),
        totalMovies,
        totalTheaters,
        totalScreens,
    };
};

/**
 * 5. Movies Management (Admin CRUD)
 */
const getMoviesAdminService = async () => {
    return prisma.movie.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { shows: true } },
        },
    });
};

const createMovieAdminService = async ({
    title,
    description = "",
    durationMin,
    language = "Hindi",
    genre = "Action",
    releaseDate,
    posterUrl = "",
    trailerUrl = "",
    trailer_url = "",
    isActive = true,
}) => {
    if (!title || !durationMin) {
        throw new AppError("Movie title and duration in minutes are required", HTTP_STATUS.BAD_REQUEST);
    }

    const resolvedTrailer = trailerUrl ? trailerUrl.trim() : (trailer_url ? trailer_url.trim() : null);

    const movie = await prisma.movie.create({
        data: {
            title: title.trim(),
            description: description ? description.trim() : null,
            durationMin: Number(durationMin),
            language: language.trim(),
            genre: genre.trim(),
            releaseDate: releaseDate ? new Date(releaseDate) : null,
            posterUrl: posterUrl ? posterUrl.trim() : null,
            trailerUrl: resolvedTrailer,
            isActive: Boolean(isActive),
        },
    });

    return movie;
};

const updateMovieAdminService = async (movieId, data) => {
    const existing = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!existing) {
        throw new AppError("Movie not found", HTTP_STATUS.NOT_FOUND);
    }

    const resolvedTrailer = data.trailerUrl !== undefined
        ? (data.trailerUrl ? data.trailerUrl.trim() : null)
        : (data.trailer_url !== undefined ? (data.trailer_url ? data.trailer_url.trim() : null) : undefined);

    const updated = await prisma.movie.update({
        where: { id: movieId },
        data: {
            ...(data.title && { title: data.title.trim() }),
            ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
            ...(data.durationMin && { durationMin: Number(data.durationMin) }),
            ...(data.language && { language: data.language.trim() }),
            ...(data.genre && { genre: data.genre.trim() }),
            ...(data.releaseDate !== undefined && { releaseDate: data.releaseDate ? new Date(data.releaseDate) : null }),
            ...(data.posterUrl !== undefined && { posterUrl: data.posterUrl ? data.posterUrl.trim() : null }),
            ...(resolvedTrailer !== undefined && { trailerUrl: resolvedTrailer }),
            ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        },
    });

    return updated;
};

const deleteMovieAdminService = async (movieId) => {
    const existing = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!existing) {
        throw new AppError("Movie not found", HTTP_STATUS.NOT_FOUND);
    }

    // Soft-deactivate associated shows
    await prisma.show.updateMany({
        where: { movieId },
        data: { isActive: false },
    });

    return prisma.movie.update({
        where: { id: movieId },
        data: { isActive: false },
    });
};

/**
 * 6. Shows Management (Admin List & Cancel)
 */
const getShowsAdminService = async () => {
    return prisma.show.findMany({
        where: { isActive: true },
        orderBy: { startTime: "asc" },
        include: {
            movie: true,
            screen: {
                include: { theater: true },
            },
            _count: {
                select: { showSeats: true },
            },
        },
    });
};

const cancelShowAdminService = async (showId) => {
    const show = await prisma.show.findUnique({ where: { id: showId } });
    if (!show) {
        throw new AppError("Show not found", HTTP_STATUS.NOT_FOUND);
    }

    // Release any HELD show_seats
    await prisma.showSeat.updateMany({
        where: { showId, status: "HELD" },
        data: { status: "AVAILABLE", holdToken: null, holdExpiresAt: null },
    });

    return prisma.show.update({
        where: { id: showId },
        data: { isActive: false },
    });
};

const getRecentBookingsAdminService = async (limit = 10) => {
    return prisma.booking.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { id: true, name: true, email: true } },
            show: {
                include: {
                    movie: { select: { title: true, posterUrl: true } },
                    screen: { include: { theater: { select: { name: true, city: true } } } },
                },
            },
            bookingSeats: { include: { showSeat: { include: { seat: true } } } },
            payments: true,
        },
    });
};

export {
    createTheaterAdminService,
    getTheatersAdminService,
    updateTheaterAdminService,
    deleteTheaterAdminService,
    createScreenWithLayoutService,
    updateScreenSeatsService,
    getScreenWithSeatsAdminService,
    scheduleShowAdminService,
    getAdminStatsService,
    getMoviesAdminService,
    createMovieAdminService,
    updateMovieAdminService,
    deleteMovieAdminService,
    getShowsAdminService,
    cancelShowAdminService,
    getRecentBookingsAdminService,
};

