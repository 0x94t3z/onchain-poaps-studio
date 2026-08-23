import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  webpack(config) {
    // Pino references this optional development transport from WalletConnect's
    // dependency graph. The application never enables it in the browser.
    config.resolve.alias["pino-pretty"] = false;
    return config;
  },
};

export default nextConfig;
