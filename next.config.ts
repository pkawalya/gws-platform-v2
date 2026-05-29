import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    cpus: 1,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
