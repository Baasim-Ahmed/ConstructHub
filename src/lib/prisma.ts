import { PrismaClient } from "@prisma/client";

// Reload trigger for schema updates

// Singleton Prisma Client instance

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
