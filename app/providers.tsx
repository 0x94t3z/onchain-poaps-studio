"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { State } from "wagmi";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/blockchain/wagmi-config";
import { useState } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";

const ROUTE_SWITCH_STALE_TIME = 45_000;
const ROUTE_SWITCH_CACHE_TIME = 5 * 60_000;

export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: ROUTE_SWITCH_CACHE_TIME,
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: ROUTE_SWITCH_STALE_TIME,
          },
        },
      }),
  );
  return (
    <WagmiProvider config={config} initialState={initialState} reconnectOnMount>
      <QueryClientProvider client={client}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
