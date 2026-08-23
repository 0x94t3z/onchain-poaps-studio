"use client";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";
import { useState } from "react";
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config} reconnectOnMount>
      <QueryClientProvider client={client}>
        <RainbowKitProvider
          modalSize="compact"
          theme={lightTheme({
            accentColor: "#151515",
            accentColorForeground: "#ffffff",
            borderRadius: "none",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
