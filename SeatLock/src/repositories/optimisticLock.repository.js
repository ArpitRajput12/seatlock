import prisma from "../config/db.js";

/**
 * Reads a ShowSeat row along with its version column for Compare-And-Swap (CAS) evaluation.
 */
const findShowSeatForOptimisticLock = async (tx, showSeatId) => {
    return (tx || prisma).showSeat.findUnique({
        where: { id: showSeatId },
    });
};

/**
 * Optimistically updates a ShowSeat using version matching.
 * Returns count: 1 if successful, or count: 0 if a race condition modified the version.
 */
const updateShowSeatOptimistically = async (
    tx,
    showSeatId,
    currentVersion,
    data
) => {
    return (tx || prisma).showSeat.updateMany({
        where: {
            id: showSeatId,
            version: currentVersion,
        },
        data: {
            ...data,
            version: { increment: 1 },
        },
    });
};

export {
    findShowSeatForOptimisticLock,
    updateShowSeatOptimistically,
};
