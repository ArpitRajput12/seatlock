import prisma from "../config/db.js";

const lockShowSeat = async (tx, showSeatId) => {
    const result = await tx.$queryRaw`
        SELECT
            id,
            "showId",
            "seatId",
            status,
            "holdToken",
            "holdExpiresAt",
            version,
            price
        FROM "ShowSeat"
        WHERE id = ${showSeatId}
        FOR UPDATE
    `;

    return result[0] || null;
};

const updateShowSeatWithLock = async (
    tx,
    showSeatId,
    data
) => {
    return tx.showSeat.update({
        where: {
            id: showSeatId,
        },
        data,
    });
};

export {
    lockShowSeat,
    updateShowSeatWithLock,
};