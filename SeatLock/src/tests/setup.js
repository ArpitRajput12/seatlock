import "dotenv/config";

afterAll(async () => {
    const { default: redis } =
        await import("../config/redis.js");

    const { default: prisma } =
        await import("../config/db.js");

    if (redis && redis.status !== "end") {
        await redis.quit();
    }

    await prisma.$disconnect();
});