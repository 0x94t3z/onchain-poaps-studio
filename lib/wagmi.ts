"use client";
import { createConfig, createStorage, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();

// Keep the host wallet first for the native Mini App path. WalletConnect is the
// single external-wallet route in both the Mini App and standalone website.
const connectors = [
  farcasterMiniApp(),
  ...(typeof window !== "undefined" && walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: "Onchain POAPs",
            description: "Create, distribute and collect POAPs on Base.",
            url: appUrl,
            icons: [`${appUrl}/icon-v2.png`],
          },
        }),
      ]
    : []),
];

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
