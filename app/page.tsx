import Link from "next/link";
import { EventGrid } from "@/components/event-grid";
import { ArrowUpRight, Sparkles, ShieldCheck, Radio } from "lucide-react";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="pill">● TESTING ON BASE SEPOLIA</div>
          <h1>
            PROOF
            <br />
            YOU SHOWED
            <br />
            <em>UP.</em>
          </h1>
          <p>
            Create a POAP with its artwork and event details stored directly
            onchain. Choose who can mint it, share the link, and let attendees
            keep a verifiable record.
          </p>
          <div className="actions">
            <Link className="button jumbo" href="/create">
              Create a POAP <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" href="/explore">
              Browse POAPs →
            </Link>
          </div>
        </div>
        <div className="hero-medal">
          <div className="orbit">ONCHAIN • BASE • ERC-1155 •</div>
          <div className="medal">
            <Sparkles size={56} />
            <strong>
              I WAS
              <br />
              THERE
            </strong>
            <small>ONCHAIN POAPS</small>
          </div>
        </div>
      </section>
      <section className="marquee">
        <span className="marquee-desktop">
          ONCHAIN ARTWORK ✦ SOULBOUND OR TRANSFERABLE ✦ FOUR WAYS TO MINT ✦
        </span>
        <span className="marquee-mobile">
          ONCHAIN ARTWORK ✦ FLEXIBLE MINTS ✦ STORED ON BASE
        </span>
      </section>
      <section className="section home-latest">
        <div className="section-head">
          <div>
            <span className="eyebrow">LATEST POAPS</span>
            <h2>Recently created</h2>
          </div>
          <Link href="/explore">View all →</Link>
        </div>
        <EventGrid limit={3} mobileLimit={2} prioritizeClaimable />
      </section>
      <section className="features">
        <article>
          <Radio />
          <h3>Four mint methods</h3>
          <p>
            Use an open mint, an allowlist, direct creator drops, or signed
            passes for known attendees.
          </p>
        </article>
        <article>
          <ShieldCheck />
          <h3>Stored on Base</h3>
          <p>
            The SVG and metadata live in the contract. The token does not depend
            on IPFS or your website staying online.
          </p>
        </article>
        <article>
          <Sparkles />
          <h3>Clear before you sign</h3>
          <p>
            See the artwork, rules, deadline, and mint method before sending a
            wallet transaction.
          </p>
        </article>
      </section>
    </>
  );
}
