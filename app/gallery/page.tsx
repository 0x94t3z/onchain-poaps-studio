"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { EventGrid } from "@/components/event-grid";
import { WalletButton } from "@/components/wallet-button";
export default function Gallery() {
  const { address } = useAccount();
  const [view, setView] = useState<"collected" | "created">("collected");
  return (
    <section className="page gallery-page">
      <span className="eyebrow">YOUR POAPS</span>
      <h1>
        Collected and
        <br />
        <em>created.</em>
      </h1>
      <p className="lead">
        See the POAPs this wallet owns and the events it registered. Ownership
        and event details are verified from onchain contract data.
      </p>
      {address ? (
        <>
          <div
            className="event-filters gallery-tabs"
            role="tablist"
            aria-label="Choose POAP ownership view"
          >
            <button
              type="button"
              role="tab"
              id="collected-tab"
              aria-selected={view === "collected"}
              aria-controls="poap-ownership-panel"
              onClick={() => setView("collected")}
            >
              Collected
            </button>
            <button
              type="button"
              role="tab"
              id="created-tab"
              aria-selected={view === "created"}
              aria-controls="poap-ownership-panel"
              onClick={() => setView("created")}
            >
              Created
            </button>
          </div>
          <div
            id="poap-ownership-panel"
            role="tabpanel"
            aria-labelledby={`${view}-tab`}
          >
            <EventGrid
              owner={address}
              ownerFilter={view}
              limit={6}
              mobileLimit={4}
              paginate
            />
          </div>
        </>
      ) : (
        <div className="empty">
          <h3>Connect your wallet</h3>
          <p>
            Your collected and created POAPs will appear here. We do not ask
            for an email or profile.
          </p>
          <WalletButton />
        </div>
      )}
    </section>
  );
}
