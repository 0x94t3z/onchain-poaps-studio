import Link from "next/link";
import { CONTRACT, explorer } from "@/lib/constants";
const sections = [
  [
    "creating",
    "Creating a POAP",
    <>
      <p>
        Connect a wallet on Base Sepolia and open{" "}
        <Link href="/create">Create</Link>. Add a name and raw SVG file, then
        choose whether the token is soulbound and whether public minting starts
        open. Description, location, event date, URL, and allowlist are
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
        <a href="https://jakearchibald.github.io/svgomg/">SVGOMG</a>. Smaller
        SVGs cost less gas.
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
    </>,
  ],
  [
    "distribution",
    "Distribution methods",
    <>
      <h3>Public mint</h3>
      <p>
        When open, any wallet can call <code>mint</code>. Creators can open or
        close it during the first 30 days; public minting itself has no
        automatic expiry.
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
      <h3>Signed pass</h3>
      <p>
        The creator signs the packed hash of{" "}
        <code>(eventId, chainId, recipient)</code>. The contract applies
        Ethereum’s signed-message prefix and recovers the creator. Each pass is
        valid for one wallet and expires 37 days after registration.
      </p>
      <h3>Creator drop</h3>
      <p>
        During the first 30 days, creators may mint directly to batches of at
        most 101 recipients. Already-claimed wallets are skipped.
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
          during days 0–30.
        </li>
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
    "verify",
    "Verify a mint",
    <>
      <p>
        After the transaction confirms, open it on BaseScan or view the token on
        OpenSea. Gallery checks <code>balanceOf(wallet, eventId)</code>{" "}
        directly. You can also inspect{" "}
        <a href={explorer(`address/${CONTRACT}#code`)}>the verified contract</a>
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
          <a key={id as string} href={`#${id}`}>
            {title}
          </a>
        ))}
      </aside>
      <div className="doc-body">
        {sections.map(([id, title, body], i) => (
          <article id={id as string} key={id as string}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <h2>{title}</h2>
            {body}
          </article>
        ))}
      </div>
    </section>
  );
}
