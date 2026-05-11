import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't drift up to $HOME when there's
  // a stray package-lock.json sitting there.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
