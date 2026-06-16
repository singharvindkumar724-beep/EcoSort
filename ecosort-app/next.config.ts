import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",
  // Mark Prisma and pg as server-only external packages
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
  // Disable Next.js telemetry
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
};

export default nextConfig;
