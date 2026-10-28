import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: "SeatLock/.env" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "postgresql://postgres:arpit%40%231234@127.0.0.1:5432/seatlock?schema=public",
  },
});
