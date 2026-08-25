"use client";
import { useEffect, useRef, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { Search, X } from "lucide-react";
import { poapAbi } from "@/lib/abi";
import { CONTRACT, SIGNATURE_WINDOW, ZERO_ROOT } from "@/lib/constants";
import { decodeMetadata } from "@/lib/metadata";
import { EventCard } from "./event-card";

type ClaimFilter = "all" | "claimable" | "closed";

const metadataFallbackImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#171717"/><circle cx="256" cy="256" r="112" fill="none" stroke="#eaff2f" stroke-width="24"/><circle cx="256" cy="256" r="24" fill="#eaff2f"/></svg>',
)}`;

export function EventGrid({
  owner,
  limit,
  mobileLimit,
  paginate = false,
  searchable = false,
  filterable = false,
  prioritizeClaimable = false,
}: {
  owner?: `0x${string}`;
  limit?: number;
  mobileLimit?: number;
  paginate?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  prioritizeClaimable?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>("all");
  const [isMobile, setIsMobile] = useState(false);
  const [now, setNow] = useState(0);
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
  useEffect(() => setNow(Math.floor(Date.now() / 1000)), []);
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
  const events = useReadContracts({
    contracts: collectionIds.map((id) => ({
      address: CONTRACT, abi: poapAbi, functionName: "events", args: [id],
    }) as const),
    query: { enabled: collectionIds.length > 0 },
  });
  const uris = useReadContracts({
    contracts: collectionIds.map((id) => ({
      address: CONTRACT, abi: poapAbi, functionName: "uri", args: [id],
    }) as const),
    query: { enabled: collectionIds.length > 0 },
  });
  const loading = now === 0 || total.isLoading || (Boolean(owner) && balances.isLoading) ||
    (collectionIds.length > 0 && (events.isLoading || uris.isLoading));
  if (loading) return <div className="empty">Loading POAPs from Base Sepolia…</div>;
  if (total.isError || balances.isError || events.isError || uris.isError) return (
    <div className="empty" role="alert">POAPs could not be loaded from Base Sepolia. Check your connection and try again.</div>
  );

  const cards = collectionIds.map((id, index) => {
    const event = events.data?.[index]?.result;
    const uri = uris.data?.[index]?.result;

    if (!event || !uri) {
      return {
        key: `event-${id}`,
        id,
        claimable: false,
        search: id.toString(),
        node: (
          <div className="event-card event-card-unavailable" role="status" key={id.toString()}>
            <div className="card-copy">
              <div className="eyebrow">EVENT #{id.toString().padStart(3, "0")}</div>
              <h3>Temporarily unavailable</h3>
              <p>This registration could not be read from Base Sepolia. Try refreshing the page.</p>
            </div>
          </div>
        ),
      };
    }

    const publicMint = event[10];
    const hasAllowlist = event[4].toLowerCase() !== ZERO_ROOT;
    const signedPassOpen = Number(event[7]) + SIGNATURE_WINDOW >= now;
    const claimable = publicMint || hasAllowlist || signedPassOpen;

    try {
      const meta = decodeMetadata(uri as string);
      return {
        key: `event-${id}`,
        id,
        claimable,
        search: `${id} ${JSON.stringify(meta)}`.toLowerCase(),
        node: (
          <EventCard
            key={id.toString()}
            id={id}
            meta={meta}
            publicMint={publicMint}
            soulbound={event[9]}
            claimsClosed={!claimable}
            showShare={Boolean(owner)}
          />
        ),
      };
    } catch {
      return {
        key: `event-${id}`,
        id,
        claimable,
        search: `${id} ${(event as any)[0]} ${(event as any)[1]} ${(event as any)[3]}`.toLowerCase(),
        node: (
          <EventCard
            key={id.toString()}
            id={id}
            meta={{
              name: (event as any)[0] || `Event #${id}`,
              description: (event as any)[1] || "This registration has unreadable metadata.",
              image: metadataFallbackImage,
            }}
            publicMint={publicMint}
            soulbound={event[9]}
            claimsClosed={!claimable}
            showShare={Boolean(owner)}
          />
        ),
      };
    }
  });
  const normalizedQuery = query.trim().toLowerCase();
  const orderedCards = prioritizeClaimable
    ? [...cards].sort((a, b) => {
        if (a.claimable !== b.claimable) return Number(b.claimable) - Number(a.claimable);
        return a.id === b.id ? 0 : a.id > b.id ? -1 : 1;
      })
    : cards;
  const statusCards = claimFilter === "all"
    ? orderedCards
    : orderedCards.filter((card) => claimFilter === "claimable" ? card.claimable : !card.claimable);
  const filteredCards = normalizedQuery ? statusCards.filter((card) => card.search.includes(normalizedQuery)) : statusCards;
  const pageSize = (isMobile ? mobileLimit : limit) ?? Math.max(filteredCards.length, 1);
  const pageCount = Math.max(1, Math.ceil(filteredCards.length / pageSize));
  const currentPage = paginate ? Math.min(page, pageCount - 1) : 0;
  const visibleCards = filteredCards.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const displayCount = filteredCards.length;
  function goToPage(next: number) {
    restorePosition.current = true;
    setPage(next);
  }

  function updateFilter(next: ClaimFilter) {
    setClaimFilter(next);
    setPage(0);
  }

  return (
    <div className="event-collection" ref={collectionRef} role="region" aria-label="POAP collection" tabIndex={-1}>
      {searchable && (
        <div className="event-search">
          <label htmlFor="event-search">Search POAPs</label>
          <div className="event-search-field">
            <Search size={19} aria-hidden="true" />
            <input id="event-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Name, event ID or location" autoComplete="off" />
            {query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); setPage(0); }}><X size={19} aria-hidden="true" /></button>}
          </div>
          <span aria-live="polite">{displayCount} {displayCount === 1 ? "POAP" : "POAPs"}</span>
        </div>
      )}
      {filterable && (
        <div className="event-filters" role="group" aria-label="Filter POAPs by claim status">
          <button type="button" aria-pressed={claimFilter === "all"} onClick={() => updateFilter("all")}>All</button>
          <button type="button" aria-pressed={claimFilter === "claimable"} onClick={() => updateFilter("claimable")}>Claimable</button>
          <button type="button" aria-pressed={claimFilter === "closed"} onClick={() => updateFilter("closed")}>Claims closed</button>
        </div>
      )}
      {visibleCards.length ? <div className="grid event-grid">{visibleCards.map((card) => card.node)}</div> : (
        <div className="empty">{query ? `No POAPs match “${query.trim()}”.` : claimFilter === "all" ? "No POAPs found here yet." : `No ${claimFilter === "claimable" ? "claimable POAPs" : "POAPs with closed claims"} found.`}</div>
      )}
      {filteredCards.length > 0 && paginate && pageCount > 1 && (
        <nav className="event-pagination" aria-label="POAP collection pages">
          <button type="button" onClick={() => goToPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>← Previous</button>
          <span aria-live="polite">Page {currentPage + 1} of {pageCount}</span>
          <button type="button" onClick={() => goToPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage === pageCount - 1}>Next →</button>
        </nav>
      )}
    </div>
  );
}
