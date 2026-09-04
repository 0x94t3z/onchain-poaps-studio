"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { EventGrid } from "@/features/events/event-grid";
import { WalletButton } from "@/features/wallet/wallet-button";
import { WalletPoapOverview } from "@/features/gallery/wallet-poap-overview";

const GALLERY_VIEW_KEY = "onchain-poaps:gallery-view";

export default function Gallery() {
  const { address } = useAccount();
  const [view, setView] = useState<"collected" | "created">("collected");

  useEffect(() => {
    if (!address) return;
    try {
      const savedView = sessionStorage.getItem(GALLERY_VIEW_KEY);
      if (savedView === "collected" || savedView === "created") {
        setView(savedView);
      }
    } catch {
      // Keep the default collected view when storage is unavailable.
    }
  }, [address]);

  function selectView(next: "collected" | "created") {
    setView(next);
    try {
      sessionStorage.setItem(GALLERY_VIEW_KEY, next);
    } catch {
      // The tab change still works for the current render.
    }
  }

  return (
    <section className="page gallery-page">
      <div
        className={`gallery-intro${address ? " gallery-intro-with-overview" : ""}`}
      >
        <div>
          <span className="eyebrow">YOUR POAPS</span>
          <h1>
            Collected and
            <br />
            <em>created.</em>
          </h1>
          <p className="lead">
            See the POAPs this wallet owns and the events it registered.
            Ownership and event details are verified from onchain contract data.
          </p>
        </div>
        {address && <WalletPoapOverview owner={address} />}
      </div>
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
              onClick={() => selectView("collected")}
            >
              Collected
            </button>
            <button
              type="button"
              role="tab"
              id="created-tab"
              aria-selected={view === "created"}
              aria-controls="poap-ownership-panel"
              onClick={() => selectView("created")}
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
              searchable
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
