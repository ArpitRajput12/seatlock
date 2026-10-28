import prisma from "../config/db.js";

const createUser = async ({ name, email, passwordHash, role = "USER" }) => {
    return prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

const findUserByEmail = async (email) => {
    return prisma.user.findUnique({
        where: { email },
    });
};

const findUserById = async (id) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

const updateUser = async (id, data) => {
    return prisma.user.update({
        where: { id },
        data,
    });
};

const createRefreshToken = async ({ userId, token, expiresAt }) => {
    return prisma.refreshToken.create({
        data: {
            userId,
            token,
            expiresAt,
        },
    });
};

const findRefreshToken = async (userId, token) => {
    return prisma.refreshToken.findFirst({
        where: {
            userId,
            token,
        },
    });
};

const findRefreshTokenByToken = async (token) => {
    return prisma.refreshToken.findUnique({
        where: { token },
    });
};

const deleteRefreshToken = async (id) => {
    return prisma.refreshToken.delete({
        where: { id },
    });
};

const deleteUserRefreshTokens = async (userId, token) => {
    return prisma.refreshToken.deleteMany({
        where: {
            userId,
            token,
        },
    });
};

const revokeRefreshToken = async (id) => {
    return prisma.refreshToken.update({
        where: { id },
        data: {
            revokedAt: new Date(),
        },
    });
};

export {
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    createRefreshToken,
    findRefreshToken,
    findRefreshTokenByToken,
    deleteRefreshToken,
    deleteUserRefreshTokens,
    revokeRefreshToken,
};
