import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["@resvg/resvg-js"],
  webpack(config) {
    // These packages are optional Node/React Native integrations referenced by
    // wallet SDKs but are never used by this browser application.
    config.resolve.alias["pino-pretty"] = false;
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    return config;
  },
};

export default nextConfig;
