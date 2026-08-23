"use client";
import { createConfig, createStorage, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
export const walletConnectConfigured = Boolean(walletConnectProjectId);

const rainbowConnectors =
  typeof window !== "undefined" && walletConnectProjectId
    ? getDefaultWallets({
        appName: "Onchain POAPs",
        appDescription: "Create, distribute and collect POAPs on Base.",
        appUrl,
        appIcon: `${appUrl}/icon-v2.png`,
        projectId: walletConnectProjectId,
      }).connectors
    : [];

// Farcaster remains the native Mini App route. RainbowKit provides the wallet
// picker and WalletConnect transport for every external wallet.
const connectors = [farcasterMiniApp(), ...rainbowConnectors];

export const config = createConfig({
  chains: [baseSepolia],
  connectors,
  storage: createStorage({
    key: "wagmi",
    storage:
      typeof window === "undefined" ? undefined : window.localStorage,
  }),
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org",
    ),
  },
  ssr: true,
});
