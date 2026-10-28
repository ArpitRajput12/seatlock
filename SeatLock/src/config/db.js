import env from "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
    connectionString: env.databaseUrl || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

export { prisma };
export default prisma;
