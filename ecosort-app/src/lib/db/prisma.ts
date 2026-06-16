/**
 * Prisma Client singleton for Next.js
 *
 * In development, Next.js hot-reloading can create multiple Prisma Client
 * instances, exhausting the database connection pool. This pattern caches
 * the instance on the global object to prevent that.
 *
 * Uses @prisma/adapter-pg with the DATABASE_URL pooler connection (PgBouncer)
 * for runtime queries, and DIRECT_URL for migrations (handled in prisma.config.ts).
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// Extend the global NodeJS object to cache the Prisma instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Copy .env.example to .env.local and fill in your Supabase connection string."
    );
  }

  // Use connection pool (PgBouncer-compatible) for runtime queries
  const pool = new Pool({
    connectionString,
    // Supabase PgBouncer transaction mode: max 1 connection per query
    max: 10,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    // @ts-expect-error — adapter support is in preview
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

// Singleton: reuse in development, create fresh in production
const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;
export { prisma };
