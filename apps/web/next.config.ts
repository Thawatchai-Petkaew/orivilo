import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@orivilo/intent-engine",
    "@orivilo/design-system",
    "@orivilo/auth",
    "@orivilo/db",
  ],
};

export default nextConfig;
