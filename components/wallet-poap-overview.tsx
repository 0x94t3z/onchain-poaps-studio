"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useReadContract, useReadContracts } from "wagmi";
import type { Address } from "viem";
import { poapAbi } from "@/lib/abi";
import { CONTRACT } from "@/lib/constants";
import { hasPartialContractResults } from "@/lib/event-ownership";

export function WalletPoapOverview({ owner }: { owner: Address }) {
  const total = useReadContract({
    address: CONTRACT,
    abi: poapAbi,
    functionName: "totalEvents",
  });
  const count = Number(total.data ?? 0n);
  const eventIds = Array.from({ length: count }, (_, index) =>
    BigInt(count - index),
  );
  const balances = useReadContracts({
    contracts: eventIds.map(
      (eventId) =>
        ({
          address: CONTRACT,
          abi: poapAbi,
          functionName: "balanceOf",
          args: [owner, eventId],
        }) as const,
    ),
    query: { enabled: count > 0 },
  });
  const created = useQuery({
    queryKey: ["created-event-ids", owner],
    staleTime: 30_000,
    queryFn: async () => {
      const response = await fetch(`/api/events/created/${owner}`);
      const payload = (await response.json()) as {
        eventIds?: string[];
        error?: string;
      };
      if (!response.ok || !payload.eventIds)
        throw new Error(payload.error || "Created POAPs could not be loaded.");
      return payload.eventIds.map(BigInt);
    },
  });
  const collectedCount = balances.data?.filter(
    (balance) => balance.status === "success" && (balance.result ?? 0n) > 0n,
  ).length;
  const collectedLoading = total.isLoading || balances.isLoading;
  const collectedFailed =
    total.isError ||
    balances.isError ||
    hasPartialContractResults(balances.data);
  const createdLoading = created.isLoading;
  const createdFailed = created.isError;

  return (
    <aside className="gallery-overview" aria-label="Wallet POAP overview">
      <span className="eyebrow">WALLET OVERVIEW</span>
      <h2>Your onchain archive.</h2>
      <dl
        aria-live="polite"
        aria-busy={collectedLoading || createdLoading}
      >
        <div>
          <dt>Collected</dt>
          <dd title={collectedFailed ? "Count temporarily unavailable" : undefined}>
            {collectedLoading || collectedFailed ? "—" : collectedCount ?? 0}
          </dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd title={createdFailed ? "Count temporarily unavailable" : undefined}>
            {createdLoading || createdFailed ? "—" : created.data?.length ?? 0}
          </dd>
        </div>
      </dl>
      <div className="gallery-overview-footer">
        <span>BASE SEPOLIA · ONCHAIN</span>
        <Link href="/create">Create a POAP →</Link>
      </div>
    </aside>
  );
}
