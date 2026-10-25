import type { NextConfig } from "next";
import { staticSecurityHeaders } from "./security-headers";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@orivilo/intent-engine",
    "@orivilo/design-system",
    "@orivilo/auth",
    "@orivilo/db",
  ],
  async headers() {
    return [{ source: "/:path*", headers: [...staticSecurityHeaders] }];
  },
};

export default nextConfig;
