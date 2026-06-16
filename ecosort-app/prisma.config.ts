/**
 * Prisma Configuration (Prisma 7+)
 * Reference: https://pris.ly/d/config-datasource
 *
 * For Supabase:
 * - db push / migrations need the SESSION-mode pooler (port 5432) WITHOUT pgbouncer=true
 * - Runtime PrismaClient uses TRANSACTION-mode pooler (port 6543 with pgbouncer=true)
 *
 * The Supabase "IPv4 Add-on" or "Direct Connection" (port 5432 without pooler) is
 * required for DDL operations. If port 5432 is blocked, enable Supabase IPv4 add-on
 * or use the Supabase Dashboard → SQL Editor to run migrations manually.
 */

import { config } from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js convention), fall back to .env
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

// For db push: use DIRECT_URL (session-mode, port 5432, no pgbouncer)
// Strip pgbouncer=true if present since DDL requires a true session connection
function getDirectUrl(): string {
  const raw =
    process.env.DIRECT_URL ??
    (process.env.DATABASE_URL ?? "").replace("?pgbouncer=true", "");

  if (!raw) {
    throw new Error(
      "DIRECT_URL or DATABASE_URL is not set.\n" +
        "Create .env.local from .env.example and fill in your Supabase credentials."
    );
  }

  // Always remove pgbouncer=true for migration connections
  return raw.replace(/[?&]pgbouncer=true/g, "");
}

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: getDirectUrl(),
  },
  migrations: {
    seed: "ts-node --project tsconfig.seed.json prisma/seed.ts",
  },
});
