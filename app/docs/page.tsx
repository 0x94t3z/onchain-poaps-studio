import type { ReactNode } from "react";
import Link from "next/link";
import { CONTRACT, explorer } from "@/lib/blockchain/constants";

const sections: Array<[string, string, ReactNode]> = [
  [
    "quick-start",
    "Quick start",
    <>
      <h3>For organizers</h3>
      <ol>
        <li>Create the artwork and event details.</li>
        <li>Choose whether the POAP is soulbound or transferable.</li>
        <li>
          Choose the claim routes: public link, allowlist proof, signed pass, or
          creator drop.
        </li>
        <li>
          Register the event on Base Sepolia. After this, the artwork,
          metadata, and soulbound setting are permanent.
        </li>
        <li>
          Share the claim page, send allowlist proofs, generate signed-pass QR
          codes, or mint directly to attendee wallets from Manage.
        </li>
      </ol>
      <h3>For collectors</h3>
      <p>
        Open the event page, connect the wallet that should hold the POAP, and
        use the mint route the organizer gave you. Public mints only need the
        page link. Allowlist mints need your proof. Signed passes need the QR,
        private link, or signature issued for your wallet.
      </p>
    </>,
  ],
  [
    "creating",
    "Creating a POAP",
    <>
      <p>
        Connect a wallet on Base Sepolia and open{" "}
        <Link href="/create">Create</Link>. Build artwork in the studio or
        upload a self-contained SVG. Then add event details and pick the claim
        routes. Description, location, event date, URL, and allowlist are
        optional. The name is limited to 128 bytes, the description to 512, and
        the location and URL to 128 each.
      </p>
      <p>
        Registration calls{" "}
        <code>
          registerEvent(name, description, eventDate, location, allowlistRoot,
          svg, externalUrl, flags)
        </code>
        . The flags record whether transfers and public minting are enabled.
        Event details cannot be edited after registration.
      </p>
      <p>
        If you add an allowlist during creation, download the proof file before
        registering. The app blocks review until that file is downloaded. The
        contract keeps only the root, so the exported file is what lets you hand
        each attendee their proof later.
      </p>
    </>,
  ],
  [
    "metadata",
    "Metadata & SVG",
    <>
      <p>
        The contract Base64-encodes the raw SVG and stores it with SSTORE2. Its
        ERC-1155 <code>uri(id)</code> returns an onchain Base64 JSON document
        containing the artwork, description, date, location, creator, event ID,
        CAIP-2 ID, and soulbound status.
      </p>
      <p>
        Use a square <code>viewBox</code>, avoid remote fonts/images/scripts,
        convert text to paths when exact typography matters, and optimize with{" "}
        <a
          href="https://jakearchibald.github.io/svgomg/"
          target="_blank"
          rel="noreferrer"
        >
          SVGOMG
        </a>
        . Smaller SVGs cost less gas.
      </p>
    </>,
  ],
  [
    "soulbound",
    "Soulbound vs transferable",
    <>
      <p>
        Soulbound POAPs cannot move between wallets after minting. Transferable
        POAPs can be sent to another wallet. This setting cannot be changed
        after registration.
      </p>
      <p>
        Use soulbound when the wallet is the attendance record. Use
        transferable only when it is acceptable for the POAP to move to a
        different wallet later.
      </p>
    </>,
  ],
  [
    "distribution",
    "Distribution methods",
    <>
      <p>
        Every route mints the same ERC-1155 event token. The route only changes
        who can claim and what they must provide. A wallet can hold one token
        per event, even if multiple routes are open.
      </p>
      <h3>Public mint</h3>
      <p>
        When open, any wallet can call <code>mint</code>. Creators can open or
        close it during the first 30 days; public minting itself has no
        automatic expiry.
      </p>
      <p>
        Use this for open events or a single public QR code. The attendee only
        needs the event page link and Base Sepolia test ETH for gas.
      </p>
      <h3>Allowlist mint</h3>
      <p>
        The allowlist tool converts a wallet list into a Merkle root and a proof
        for each wallet. The creator can save a non-zero root once during the
        first 30 days. Each attendee uses their proof with{" "}
        <code>allowlistMint</code>. The builder uses{" "}
        <code>keccak256(abi.encodePacked(address))</code> leaves and sorted
        pairs, matching the contract's OpenZeppelin verification.
      </p>
      <p>
        Download the generated recipient-proof JSON before registering or
        saving the root. The root is permanent, and each attendee needs the
        proof generated specifically for their wallet.
      </p>
      <p>
        Plain version: the root is the public fingerprint of the attendee list.
        A proof is the private receipt for one wallet. Do not send the whole
        proof file to everyone; send each recipient only their own proof.
      </p>
      <h3>Signed pass</h3>
      <p>
        The creator signs the packed hash of{" "}
        <code>(eventId, chainId, recipient)</code>. The contract applies
        Ethereum's signed-message prefix and recovers the creator. Each pass is
        valid for one wallet and expires 37 days after registration.
      </p>
      <p>
        Use this for live check-in or private invites. Enter the attendee
        wallet in Manage, sign in the creator wallet, then send that attendee
        the generated private link, QR code, or signature.
      </p>
      <h3>Creator drop</h3>
      <p>
        During the first 30 days, creators may mint directly to batches of at
        most 101 recipients. Already-claimed wallets are skipped.
      </p>
      <p>
        Use this when you already have attendee wallets and want to deliver
        POAPs without asking each attendee to mint.
      </p>
    </>,
  ],
  [
    "proofs",
    "Generating allowlist proofs",
    <>
      <p>
        Paste one wallet address or ENS name per line in Create or Manage. The
        app resolves ENS names, removes duplicates, builds the allowlist root,
        and exports JSON containing the root plus one proof per recipient.
      </p>
      <p>
        Keep the JSON file. The contract stores the root, not the attendee list.
        To help one attendee mint, find their wallet entry in the JSON and send
        only that proof. The attendee pastes it into the Allowlist tab on the
        event page.
      </p>
    </>,
  ],
  [
    "qr",
    "Live-event QR workflow",
    <>
      <p>
        Collect the attendee's wallet address, generate its signed mint from the
        event settings page, and show or send the resulting QR code. The QR
        opens the event page with the signature included. Generate a separate
        code for each recipient because each signature is bound to one wallet.
      </p>
      <p>
        To print one QR code that anyone can scan, enable public minting and
        link directly to the event page. Use allowlist proofs for a
        pre-registered attendee list.
      </p>
      <p>
        A signed-pass QR is not a reusable public ticket. It is a private claim
        link for one wallet. If another wallet scans it, the pass fails.
      </p>
    </>,
  ],
  [
    "permissions",
    "Permissions & deadlines",
    <>
      <ul>
        <li>One claim per event per wallet across every mint route.</li>
        <li>
          Creator: set allowlist once, toggle public status, and creator-mint
          during days 0-30.
        </li>
        <li>Creator drop: maximum 101 recipients in one transaction.</li>
        <li>Signed mint: available through day 37.</li>
        <li>Public and allowlist mint: no contract expiry.</li>
        <li>Soulbound and all metadata: immutable.</li>
      </ul>
      <p>
        The contract boundary uses{" "}
        <code>createdAt + window &lt; block.timestamp</code>, so actions are
        allowed exactly at the deadline timestamp.
      </p>
    </>,
  ],
  [
    "glossary",
    "Plain-language glossary",
    <>
      <ul>
        <li>
          Smart contract: the Base Sepolia program that stores events, checks
          claim rules, and records ownership.
        </li>
        <li>
          Metadata: the token name, description, event details, and artwork
          returned by <code>uri(id)</code>.
        </li>
        <li>
          Merkle root: a compact fingerprint of an allowlist. It lets the
          contract check membership without storing every wallet.
        </li>
        <li>
          Allowlist proof: the short set of hashes one wallet submits to prove
          it is on the allowlist.
        </li>
        <li>
          Signed pass: a creator-approved private claim for one event, one
          chain, and one recipient wallet.
        </li>
      </ul>
    </>,
  ],
  [
    "verify",
    "Verify a mint",
    <>
      <p>
        After the transaction confirms, open it on BaseScan or view the token on
        OpenSea. Gallery checks <code>balanceOf(wallet, eventId)</code>{" "}
        directly. You can also inspect{" "}
        <a href={explorer(`address/${CONTRACT}#code`)}>
          the verified contract
        </a>
        , call <code>uri(id)</code>, and decode the Base64 JSON.
      </p>
    </>,
  ],
];

export default function Docs() {
  return (
    <section className="page docs">
      <div className="docs-title">
        <span className="eyebrow">DOCUMENTATION</span>
        <h1>
          Using
          <br />
          <em>Onchain POAPs.</em>
        </h1>
        <p>
          Instructions for event organizers and developers. This deployment uses
          Base Sepolia and test ETH; it is not Base mainnet.
        </p>
      </div>
      <aside>
        {sections.map(([id, title]) => (
          <a key={id} href={`#${id}`}>
            {title}
          </a>
        ))}
      </aside>
      <details className="docs-mobile-toc">
        <summary>On this page</summary>
        <nav aria-label="Documentation sections">
          {sections.map(([id, title]) => (
            <a key={id} href={`#${id}`}>
              {title}
            </a>
          ))}
        </nav>
      </details>
      <div className="doc-body">
        {sections.map(([id, title, body], i) => (
          <article id={id} key={id}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h2>{title}</h2>
            {body}
          </article>
        ))}
      </div>
    </section>
  );
}
