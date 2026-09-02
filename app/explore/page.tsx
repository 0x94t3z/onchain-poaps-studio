import { EventGrid } from "@/features/events/event-grid";
import { CONTRACT } from "@/lib/blockchain/constants";

export default function Explore() {
  return (
    <section className="page explore-page">
      <div className="explore-intro">
        <div>
          <span className="eyebrow">EXPLORE</span>
          <h1>
            POAPs registered
            <br />
            <em>onchain.</em>
          </h1>
        </div>
        <aside className="explore-context">
          <span className="eyebrow">BASE SEPOLIA · LIVE</span>
          <h2>Read from the contract.</h2>
          <p>
            Every card below comes directly from the deployed Onchain POAPs
            contract. Artwork and event details are stored onchain.
          </p>
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACT}`}
            target="_blank"
            rel="noreferrer"
          >
            View contract ↗
          </a>
        </aside>
      </div>
      <EventGrid limit={6} mobileLimit={4} paginate searchable filterable prioritizeClaimable />
    </section>
  );
}
