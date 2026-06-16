import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: "standalone" as it conflicts with Vercel
  // Mark Prisma and pg as server-only external packages
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
  // Disable Next.js telemetry
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
};

export default nextConfig;
