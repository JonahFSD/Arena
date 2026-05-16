import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't drift up to $HOME when a
  // stray package-lock.json is sitting there. Using a hardcoded relative path
  // because __dirname is unreliable when Next loads this file under Turbopack.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.convex.cloud" },
    ],
  },
};

export default nextConfig;
