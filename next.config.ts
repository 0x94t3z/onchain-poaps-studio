import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["@resvg/resvg-js"],
  webpack(config, { isServer }) {
    // These packages are optional Node/React Native integrations referenced by
    // wallet SDKs but are never used by this browser application.
    config.resolve.alias.punycode = "next/dist/compiled/punycode";
    config.resolve.alias["pino-pretty"] = false;
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    if (isServer) {
      const externals = Array.isArray(config.externals)
        ? config.externals
        : [config.externals].filter(Boolean);
      config.externals = [
        (
          context: { request?: string },
          callback: (error?: Error | null, result?: string) => void,
        ) => {
          if (context.request === "punycode") {
            callback(null, "commonjs next/dist/compiled/punycode");
            return;
          }
          callback();
        },
        ...externals,
      ];
    }
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /ox[\\/]_esm[\\/]tempo[\\/]internal[\\/]virtualMasterPool\.js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
};

export default nextConfig;
