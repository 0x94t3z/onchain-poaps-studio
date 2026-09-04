"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { State } from "wagmi";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/blockchain/wagmi-config";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  const [client] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config} initialState={initialState} reconnectOnMount>
      <QueryClientProvider client={client}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
