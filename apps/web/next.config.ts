import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker only. Vercel uses its own Next.js output pipeline.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  async rewrites() {
    const apiUrl = process.env.API_PROXY_URL ?? "http://localhost:4000";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
