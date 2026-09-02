import Link from "next/link";
import type { Metadata } from "@/lib/metadata/metadata";
export function EventCard({
  id,
  meta,
  publicMint,
  soulbound,
  claimsClosed = false,
  manageHref,
  eventHref,
}: {
  id: bigint;
  meta: Metadata;
  publicMint: boolean;
  soulbound: boolean;
  claimsClosed?: boolean;
  manageHref?: string;
  eventHref?: string;
}) {
  return (
    <article className="event-card">
      <Link href={eventHref ?? `/event/${id}`} className="event-card-link">
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
      {manageHref && (
        <Link className="event-card-manage" href={manageHref}>
          Manage event →
        </Link>
      )}
    </article>
  );
}
