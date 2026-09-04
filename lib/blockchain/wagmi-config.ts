import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage, http } from "wagmi";
import { chain } from "@/lib/blockchain/constants";

export const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
export const walletConnectConfigured = Boolean(projectId);

export const networks = [chain] as const;

export const wagmiAdapter = new WagmiAdapter({
  networks: [...networks],
  projectId: projectId || "walletconnect-project-id-required",
  ssr: true,
  connectors: [farcasterMiniApp()],
  storage: createStorage({
    key: "wagmi",
    storage: cookieStorage,
  }),
  transports: {
    [chain.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org",
    ),
  },
});

export const config = wagmiAdapter.wagmiConfig;
