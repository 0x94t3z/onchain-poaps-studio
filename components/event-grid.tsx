"use client";
import { useEffect, useRef, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { Search, X } from "lucide-react";
import { poapAbi } from "@/lib/abi";
import { CONTRACT } from "@/lib/constants";
import { decodeMetadata } from "@/lib/metadata";
import { EventCard } from "./event-card";

export function EventGrid({ owner, limit, mobileLimit, paginate = false, searchable = false }: {
  owner?: `0x${string}`; limit?: number; mobileLimit?: number; paginate?: boolean; searchable?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const collectionRef = useRef<HTMLDivElement>(null);
  const restorePosition = useRef(false);

  useEffect(() => {
    const media = matchMedia("(max-width: 850px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => setPage(0), [isMobile, owner]);
  useEffect(() => {
    if (!restorePosition.current) return;
    restorePosition.current = false;
    const frame = requestAnimationFrame(() => {
      collectionRef.current?.focus({ preventScroll: true });
      collectionRef.current?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [page]);

  const total = useReadContract({ address: CONTRACT, abi: poapAbi, functionName: "totalEvents" });
  const count = Number(total.data ?? 0n);
  const allIds = Array.from({ length: count }, (_, index) => BigInt(count - index));
  const balances = useReadContracts({
    contracts: owner ? allIds.map((id) => ({
      address: CONTRACT, abi: poapAbi, functionName: "balanceOf", args: [owner, id],
    }) as const) : [],
    query: { enabled: Boolean(owner && count) },
  });
  const collectionIds = owner
    ? allIds.filter((_, index) => (balances.data?.[index]?.result ?? 0n) > 0n)
    : allIds;
  const pageSize = (isMobile ? mobileLimit : limit) ?? Math.max(collectionIds.length, 1);
  const pageCount = Math.max(1, Math.ceil(collectionIds.length / pageSize));
  const currentPage = paginate ? Math.min(page, pageCount - 1) : 0;
  const visibleIds = collectionIds.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const events = useReadContracts({
    contracts: visibleIds.map((id) => ({
      address: CONTRACT, abi: poapAbi, functionName: "events", args: [id],
    }) as const),
    query: { enabled: visibleIds.length > 0 },
  });
  const uris = useReadContracts({
    contracts: visibleIds.map((id) => ({
      address: CONTRACT, abi: poapAbi, functionName: "uri", args: [id],
    }) as const),
    query: { enabled: visibleIds.length > 0 },
  });
  const loading = total.isLoading || (Boolean(owner) && balances.isLoading) ||
    (visibleIds.length > 0 && (events.isLoading || uris.isLoading));
  if (loading) return <div className="empty">Loading POAPs from Base Sepolia…</div>;
  if (total.isError || balances.isError || events.isError || uris.isError) return (
    <div className="empty" role="alert">POAPs could not be loaded from Base Sepolia. Check your connection and try again.</div>
  );

  const cards = visibleIds.flatMap((id, index) => {
    try {
      const event = events.data?.[index]?.result;
      const uri = uris.data?.[index]?.result;
      if (!event || !uri) return [];
      const meta = decodeMetadata(uri as string);
      return [{
        key: `event-${id}`,
        search: `${id} ${JSON.stringify(meta)}`.toLowerCase(),
        node: <EventCard key={id.toString()} id={id} meta={meta} publicMint={(event as any)[10]} soulbound={(event as any)[9]} />,
      }];
    } catch { return []; }
  });
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCards = normalizedQuery ? cards.filter((card) => card.search.includes(normalizedQuery)) : cards;
  const displayCount = normalizedQuery ? filteredCards.length : collectionIds.length;
  function goToPage(next: number) {
    restorePosition.current = true;
    setPage(next);
    setQuery("");
  }

  return (
    <div className="event-collection" ref={collectionRef} role="region" aria-label="POAP collection" tabIndex={-1}>
      {searchable && (
        <div className="event-search">
          <label htmlFor="event-search">Search this page</label>
          <div className="event-search-field">
            <Search size={19} aria-hidden="true" />
            <input id="event-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, event ID or location" autoComplete="off" />
            {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={19} aria-hidden="true" /></button>}
          </div>
          <span aria-live="polite">{displayCount} {displayCount === 1 ? "POAP" : "POAPs"}</span>
        </div>
      )}
      {filteredCards.length ? <div className="grid event-grid">{filteredCards.map((card) => card.node)}</div> : (
        <div className="empty">{query ? `No POAPs on this page match “${query.trim()}”.` : "No POAPs found here yet."}</div>
      )}
      {collectionIds.length > 0 && paginate && pageCount > 1 && (
        <nav className="event-pagination" aria-label="POAP collection pages">
          <button type="button" onClick={() => goToPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>← Previous</button>
          <span aria-live="polite">Page {currentPage + 1} of {pageCount}</span>
          <button type="button" onClick={() => goToPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage === pageCount - 1}>Next →</button>
        </nav>
      )}
    </div>
  );
}
