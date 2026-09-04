"use client";

import { createAppKit } from "@reown/appkit/react";
import {
  appUrl,
  config,
  networks,
  projectId,
  wagmiAdapter,
  walletConnectConfigured,
} from "@/lib/blockchain/wagmi-config";

export { config, walletConnectConfigured };

export const appKit = projectId
  ? createAppKit({
      adapters: [wagmiAdapter],
      networks: [...networks],
      defaultNetwork: networks[0],
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
    })
  : null;
