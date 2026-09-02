"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";
import { parseAddressEntries, resolveAddressEntries } from "@/lib/identity/address-input";

type Resolution = {
  key: string;
  status: "idle" | "resolving" | "resolved" | "error";
  addresses: Address[];
  entryCount: number;
  ensCount: number;
  error?: string;
};

const empty: Resolution = {
  key: "",
  status: "idle",
  addresses: [],
  entryCount: 0,
  ensCount: 0,
};

export function useResolvedAddressInput(input: string) {
  const key = input.trim();
  const entryCount = parseAddressEntries(input).length;
  const [resolution, setResolution] = useState<Resolution>(empty);

  useEffect(() => {
    let active = true;

    if (!key) {
      setResolution(empty);
      return;
    }

    setResolution({
      key,
      status: "resolving",
      addresses: [],
      entryCount,
      ensCount: 0,
    });

    const timer = window.setTimeout(async () => {
      try {
        const result = await resolveAddressEntries(key);
        if (active) setResolution({ key, status: "resolved", ...result });
      } catch (error) {
        if (!active) return;
        setResolution({
          key,
          status: "error",
          addresses: [],
          entryCount,
          ensCount: 0,
          error: error instanceof Error ? error.message : "Could not resolve this input.",
        });
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [entryCount, key]);

  if (!key) return empty;
  if (resolution.key === key) return resolution;

  return {
    key,
    status: "resolving" as const,
    addresses: [],
    entryCount,
    ensCount: 0,
  };
}
