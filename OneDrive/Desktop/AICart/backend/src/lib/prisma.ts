import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";

/**
 * Allow users to specify either DATABASE_URL directly or the individual DB_* vars.
 * If DATABASE_URL is missing but DB_* vars exist, build the connection string.
 */
function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return;
  }

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = process.env.DB_PORT || "3306";

  if (!host || !user || !database) {
    return;
  }

  const encodedPassword =
    typeof password === "string" && password.length > 0
      ? `:${encodeURIComponent(password)}`
      : "";

  process.env.DATABASE_URL = `mysql://${user}${encodedPassword}@${host}:${port}/${database}`;
}

ensureDatabaseUrl();

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
let prismaLocal: PrismaClient | undefined;
try {
  prismaLocal = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaLocal;
  }
} catch (err) {
  console.error("Prisma client initialization failed; continuing without DB.", err);
}
export const prisma = prismaLocal as PrismaClient;

export let dbAvailable = true;

export async function connectDB() {
  try {
    if (!prismaLocal) throw new Error("Prisma client not initialized");
    await prismaLocal.$connect();
    dbAvailable = true;
  } catch (err) {
    console.error("Database connection failed; running in dev fallback mode.", err);
    dbAvailable = false;
  }
}