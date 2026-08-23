"use client";
import { useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { Search, X } from "lucide-react";
import { poapAbi } from "@/lib/abi";
import { CONTRACT } from "@/lib/constants";
import { decodeMetadata } from "@/lib/metadata";
import { EventCard } from "./event-card";

export function EventGrid({
  owner,
  limit,
  paginate = false,
  searchable = false,
}: {
  owner?: `0x${string}`;
  limit?: number;
  paginate?: boolean;
  searchable?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const total = useReadContract({
    address: CONTRACT,
    abi: poapAbi,
    functionName: "totalEvents",
  });
  const count = Number(total.data ?? 0n);
  const ids = Array.from({ length: count + 1 }, (_, i) => BigInt(count - i));
  const events = useReadContracts({
    contracts: ids.map(
      (id) =>
        ({
          address: CONTRACT,
          abi: poapAbi,
          functionName: "events",
          args: [id],
        }) as const,
    ),
  });
  const uris = useReadContracts({
    contracts: ids.map(
      (id) =>
        ({
          address: CONTRACT,
          abi: poapAbi,
          functionName: "uri",
          args: [id],
        }) as const,
    ),
  });
  const balances = useReadContracts({
    contracts: owner
      ? ids.map(
          (id) =>
            ({
              address: CONTRACT,
              abi: poapAbi,
              functionName: "balanceOf",
              args: [owner, id],
            }) as const,
        )
      : [],
  });
  if (total.isLoading || events.isLoading || uris.isLoading)
    return <div className="empty">Loading POAPs from Base Sepolia…</div>;
  const cards = ids.flatMap((id, i) => {
    try {
      if (owner && balances.data?.[i]?.result === 0n) return [];
      const e = events.data?.[i]?.result;
      const uri = uris.data?.[i]?.result;
      if (!e || !uri) return [];
      const meta = decodeMetadata(uri as string);
      return [
        {
          key: `event-${id}`,
          search: `${id} ${JSON.stringify(meta)}`.toLowerCase(),
          node: (
            <EventCard
              key={id.toString()}
              id={id}
              meta={meta}
              publicMint={(e as any)[10]}
              soulbound={(e as any)[9]}
            />
          ),
        },
      ];
    } catch {
      return [];
    }
  });
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCards = normalizedQuery
    ? cards.filter((card) => card.search.includes(normalizedQuery))
    : cards;
  const pageSize = limit ?? Math.max(filteredCards.length, 1);
  const pageCount = Math.max(1, Math.ceil(filteredCards.length / pageSize));
  const currentPage = paginate ? Math.min(page, pageCount - 1) : 0;
  const visibleCards = filteredCards.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  return (
    <>
      {searchable && (
        <div className="event-search">
          <label htmlFor="event-search">Search POAPs</label>
          <div className="event-search-field">
            <Search size={19} aria-hidden="true" />
            <input
              id="event-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Name, event ID or location"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setPage(0);
                }}
              >
                <X size={19} aria-hidden="true" />
              </button>
            )}
          </div>
          <span aria-live="polite">
            {filteredCards.length} {filteredCards.length === 1 ? "POAP" : "POAPs"}
          </span>
        </div>
      )}
      {visibleCards.length ? (
        <div className="grid event-grid">
          {visibleCards.map((card) => card.node)}
        </div>
      ) : (
        <div className="empty">
          {query ? `No POAPs match “${query.trim()}”.` : "No POAPs found here yet."}
        </div>
      )}
      {visibleCards.length > 0 && paginate && pageCount > 1 && (
        <nav className="event-pagination" aria-label="POAP collection pages">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            disabled={currentPage === 0}
          >
            ← Previous
          </button>
          <span aria-live="polite">
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((value) => Math.min(pageCount - 1, value + 1))
            }
            disabled={currentPage === pageCount - 1}
          >
            Next →
          </button>
        </nav>
      )}
    </>
  );
}
