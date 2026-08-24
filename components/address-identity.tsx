"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { explorer } from "@/lib/constants";
import { getPrimaryEnsName } from "@/lib/ens";
import { short } from "@/lib/metadata";

export function AddressIdentity({
  address,
  context = "Address",
  maxLength = 28,
}: {
  address: Address;
  context?: string;
  maxLength?: number;
}) {
  const { data: ensName } = useQuery({
    queryKey: ["ens-primary-name", address],
    queryFn: () => getPrimaryEnsName(address),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  const label = ensName ? compactEnsName(ensName, maxLength) : short(address);

  return (
    <a
      className="creator-address"
      href={explorer(`address/${address}`)}
      target="_blank"
      rel="noreferrer"
      title={ensName ? `${ensName} · ${address}` : address}
      aria-label={ensName ? `${context} ${ensName}, ${address}` : `${context} ${address}`}
    >
      {label}
    </a>
  );
}

function compactEnsName(name: string, maxLength: number) {
  if (name.length <= maxLength) return name;
  const tailLength = Math.min(13, Math.floor(maxLength / 2));
  return `${name.slice(0, maxLength - tailLength - 1)}…${name.slice(-tailLength)}`;
}
