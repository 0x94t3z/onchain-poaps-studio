"use client";
import { useAccount } from "wagmi";
import { EventGrid } from "@/components/event-grid";
import { WalletButton } from "@/components/wallet-button";
export default function Gallery() {
  const { address } = useAccount();
  return (
    <section className="page">
      <span className="eyebrow">YOUR POAPS</span>
      <h1>
        What your wallet
        <br />
        <em>holds.</em>
      </h1>
      <p className="lead">
        Connect the wallet you used to mint. Balances are read directly from the
        contract.
      </p>
      {address ? (
        <EventGrid owner={address} />
      ) : (
        <div className="empty">
          <h3>Connect your wallet</h3>
          <p>
            Your POAPs will appear here. We do not ask for an email or profile.
          </p>
          <WalletButton />
        </div>
      )}
    </section>
  );
}
