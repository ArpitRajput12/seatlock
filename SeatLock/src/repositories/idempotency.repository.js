import prisma from "../config/db.js";

const findIdempotencyKey = async (userId, key) => {
    return prisma.idempotencyKey.findUnique({
        where: {
            userId_key: {
                userId,
                key,
            },
        },
    });
};

const createIdempotencyKey = async (data) => {
    return prisma.idempotencyKey.create({
        data,
    });
};

const updateIdempotencyKey = async (id, data) => {
    return prisma.idempotencyKey.update({
        where: { id },
        data,
    });
};

export {
    findIdempotencyKey,
    createIdempotencyKey,
    updateIdempotencyKey,
};