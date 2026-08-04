import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * True once a Supabase connection string is present.
 *
 * Checked at every call site, because the site is designed to run without a
 * database: the gallery falls back to lib/pieces.ts and the order form does a
 * dry run that logs instead of saving.
 */
export const hasDatabase = Boolean(process.env.DATABASE_URL);

/**
 * Lazily constructed so the site runs with no DATABASE_URL set, and cached on
 * globalThis so Next's dev server does not open a new pool on every hot
 * reload. Every call site must check hasDatabase first.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
