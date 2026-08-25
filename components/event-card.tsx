import Link from "next/link";
import type { Metadata } from "@/lib/metadata";
import { EventShareActions } from "@/components/event-share-actions";
export function EventCard({
  id,
  meta,
  publicMint,
  soulbound,
  claimsClosed = false,
  showShare = false,
}: {
  id: bigint;
  meta: Metadata;
  publicMint: boolean;
  soulbound: boolean;
  claimsClosed?: boolean;
  showShare?: boolean;
}) {
  return (
    <article className="event-card">
      <Link href={`/event/${id}`} className="event-card-link">
        <div className="art">
          <img src={meta.image} alt={meta.name} />
          <span className="id">#{id.toString().padStart(3, "0")}</span>
        </div>
        <div className="card-copy">
          <div className="eyebrow">
            {claimsClosed ? "CLAIMS CLOSED" : publicMint ? "OPEN MINT" : "GATED"} ·{" "}
            {soulbound ? "SOULBOUND" : "TRANSFERABLE"}
          </div>
          <h3>{meta.name}</h3>
          <p>{meta.description || "No description provided."}</p>
        </div>
      </Link>
      {showShare && (
        <EventShareActions
          compact
          eventId={id.toString()}
          eventName={meta.name}
        />
      )}
    </article>
  );
}
