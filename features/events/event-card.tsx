import Link from "next/link";
import type { Metadata } from "@/lib/metadata/metadata";

const EVENT_BACK_KEY = "onchain-poaps:event-back";

export function EventCard({
  id,
  meta,
  publicMint,
  soulbound,
  claimsClosed = false,
  manageHref,
  eventHref,
  backHref,
  backLabel,
}: {
  id: bigint;
  meta: Metadata;
  publicMint: boolean;
  soulbound: boolean;
  claimsClosed?: boolean;
  manageHref?: string;
  eventHref?: string;
  backHref?: string;
  backLabel?: string;
}) {
  function rememberBackContext() {
    if (!backHref || !backLabel) return;
    try {
      sessionStorage.setItem(
        EVENT_BACK_KEY,
        JSON.stringify({
          eventId: id.toString(),
          href: backHref,
          label: backLabel,
        }),
      );
    } catch {
      // Navigation still works when session storage is unavailable.
    }
  }

  return (
    <article className="event-card">
      <Link
        href={eventHref ?? `/event/${id}`}
        className="event-card-link"
        onClick={rememberBackContext}
      >
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
