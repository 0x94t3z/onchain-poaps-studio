"use client";
import { createConfig, createStorage, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, metaMask } from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

// Keep the host wallet first for the native Mini App path. MetaMask and
// Coinbase support mobile handoff; injected wallets serve standalone browsers.
const connectors = [
  farcasterMiniApp(),
  metaMask({
    dappMetadata: {
      name: "Onchain POAPs",
      url:
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
  }),
  injected(),
  coinbaseWallet({ appName: "Onchain POAPs Studio" }),
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
