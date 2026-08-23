"use client";

import { createAppKit } from "@reown/appkit/react";
import { baseSepolia } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createStorage, http } from "wagmi";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
export const walletConnectConfigured = Boolean(projectId);

const networks = [baseSepolia] as const;
const wagmiAdapter = new WagmiAdapter({
  networks: [...networks],
  projectId: projectId || "walletconnect-project-id-required",
  ssr: true,
  connectors: [farcasterMiniApp()],
  storage: createStorage({
    key: "wagmi",
    storage: typeof window === "undefined" ? undefined : window.localStorage,
  }),
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org",
    ),
  },
});

export const config = wagmiAdapter.wagmiConfig;

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: [...networks],
    defaultNetwork: baseSepolia,
    projectId,
    metadata: {
      name: "Onchain POAPs",
      description: "Create, distribute and collect POAPs on Base.",
      url: appUrl,
      icons: [`${appUrl}/icon-v2.png`],
    },
    allWallets: "SHOW",
    themeMode: "dark",
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: false,
    enableBaseAccount: false,
    features: {
      email: false,
      socials: false,
      swaps: false,
      onramp: false,
      history: false,
      analytics: false,
    },
  });
}
