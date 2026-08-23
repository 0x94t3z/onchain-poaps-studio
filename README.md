<div align="center">
  <a href="https://poaps.0x94t3z.site">
    <img src="./public/icon.svg" width="112" height="112" alt="Onchain POAPs logo" />
  </a>

  <h1>Onchain POAPs</h1>

  <p>Create, distribute, and collect event credentials whose artwork and metadata live directly on Base.</p>

  <p>
    <a href="https://poaps.0x94t3z.site"><strong>Open the app</strong></a> ·
    <a href="https://farcaster.xyz/miniapps/7hCH6s_9iSJh/onchain-poaps">Open in Farcaster</a> ·
    <a href="https://poaps.0x94t3z.site/explore">Explore POAPs</a> ·
    <a href="https://poaps.0x94t3z.site/docs">Read the docs</a> ·
    <a href="https://poaps.0x94t3z.site/.well-known/farcaster.json">Mini App manifest</a>
  </p>

  <p>
    <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-eeff41?style=flat-square&labelColor=171717" /></a>
    <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-f4f2e9?style=flat-square&logo=nextdotjs&logoColor=171717&labelColor=f4f2e9" />
    <img alt="TypeScript strict" src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" />
    <img alt="Base Sepolia" src="https://img.shields.io/badge/Base-Sepolia-0052ff?style=flat-square&logo=coinbase&logoColor=white" />
    <img alt="Farcaster Mini App" src="https://img.shields.io/badge/Farcaster-Mini_App-855dcd?style=flat-square" />
    <img alt="ERC-1155" src="https://img.shields.io/badge/token-ERC--1155-eeff41?style=flat-square&labelColor=171717" />
  </p>
</div>

---

Onchain POAPs is a production-oriented, open-source client for the verified Onchain POAPs contract. It works as a standalone responsive web app and as a signed Farcaster Mini App. Organizers can take an event from artwork to distribution without handling raw calldata, Merkle-tree internals, or signature payloads.

> **Network notice:** the public deployment currently uses **Base Sepolia** and test ETH. It never asks for Base mainnet funds. The client is ready for real use on the supplied testnet contract; a mainnet launch requires a reviewed mainnet contract address and production RPC configuration.

## Live deployment

| Resource | Link |
| --- | --- |
| Standalone application | [poaps.0x94t3z.site](https://poaps.0x94t3z.site) |
| Farcaster Mini App | [Open in Farcaster](https://farcaster.xyz/miniapps/7hCH6s_9iSJh/onchain-poaps) |
| Signed Mini App manifest | [`.well-known/farcaster.json`](https://poaps.0x94t3z.site/.well-known/farcaster.json) |
| Verified contract | [`0xC324…9de6`](https://sepolia.basescan.org/address/0xC3249356a483fbe17d5355D39105D2eA666d9de6#code) |
| Example registered POAP | [Event #7](https://poaps.0x94t3z.site/event/7) |
| Registration transaction | [BaseScan](https://sepolia.basescan.org/tx/0xac137763b73be0d727f7b2dd5532e757cbbe94ace2c2c254fcf6bc716ea9142f) |
| Example token | [BaseScan](https://sepolia.basescan.org/token/0xC3249356a483fbe17d5355D39105D2eA666d9de6?a=7) · [OpenSea](https://testnets.opensea.io/assets/base_sepolia/0xC3249356a483fbe17d5355D39105D2eA666d9de6/7) |

## What it does

### Create

- Build compact, self-contained SVG artwork in the browser using three layouts, five palettes, and four vector marks.
- Upload or paste a custom raw SVG and preview its encoded byte size before registration.
- Register every contract-supported field: name, SVG, soulbound state, public-mint state, allowlist root, description, location, event date, and project URL.
- Review the final immutable artwork and metadata before sending the transaction.

### Distribute

- **Public mint:** let any wallet claim once while public minting is open.
- **Allowlist mint:** generate a compatible Merkle tree from wallet addresses, export recipient proofs, lock the root once, and let eligible wallets claim.
- **Signed mint:** create recipient-bound signatures and private QR links without paying gas to issue them.
- **Creator mint:** send the POAP directly to batches of up to 101 attendee wallets.

### Collect and verify

- Browse registered events directly from the contract.
- Search by event name, ID, or location.
- View the POAPs held by the connected wallet as a collection.
- Inspect artwork, metadata, distribution state, and deadlines before minting.
- Verify registrations, mints, ownership, and token metadata through BaseScan and OpenSea.

## Contract feature coverage

| Contract capability | Product workflow |
| --- | --- |
| `register` with all supported parameters | Four-step creation flow with artwork, metadata, distribution, and immutable review |
| Soulbound or transferable | Plain-language choice during creation and a visible status on event cards and detail pages |
| Public mint | Availability-aware mint tab with one-claim-per-wallet feedback |
| Allowlist mint | Address-list builder, deterministic Merkle proofs, exportable JSON, root lock, and proof entry |
| Signature mint | Creator-side signing, recipient-bound URL and QR generation, deadline display, and redemption tab |
| Public-mint controls | Creator-only management screen with current status and the 30-day deadline |
| Creator batch mint | Validated, deduplicated recipient input capped at 101 wallets |
| ERC-1155 gallery | Connected-wallet token discovery with artwork, metadata, and verification links |
| Fully onchain metadata | Raw SVG and event metadata decoded from the contract rather than an application database |

The supplied smart contract is not modified, proxied, or wrapped. The verified contract remains the source of truth for permissions, timing, validation, and token behavior.

## Important protocol rules

- Each wallet can receive an event token only once across all mint methods.
- Artwork, event metadata, and the soulbound setting are immutable after registration.
- The creator has 30 days after registration to toggle public minting, set the allowlist root, or creator-mint.
- A non-zero allowlist root can be set only once.
- Recipient-specific signed mints are valid for 37 days after registration.
- Public and allowlist minting do not automatically expire at the contract level.
- Soulbound tokens cannot be transferred after minting.
- Contract reads are public; creating, minting, and management actions require a wallet on Base Sepolia.

## User flows

### Register a POAP

1. Open [`/create`](https://poaps.0x94t3z.site/create) and build or upload the artwork.
2. Enter the event details and review which fields become permanent.
3. Choose soulbound or transferable and configure the initial distribution methods.
4. Inspect the complete preview, connect the creator wallet, and approve the registration transaction.
5. Use the resulting event page to share the mint or open creator controls.

### Configure an allowlist

1. Open the event's creator-only management page during the first 30 days.
2. Paste one wallet address per line. Invalid entries are rejected; valid entries are normalized and deduplicated.
3. Download the generated JSON before setting the root. It contains the root and each recipient's proof.
4. Save the root onchain once, then privately distribute each recipient's proof.
5. The attendee selects **Allowlist**, connects the listed wallet, enters the proof, and mints.

### Issue a signed pass

1. Enter the recipient wallet in the event management page.
2. Sign the event-, chain-, and recipient-bound payload. Signing does not send a transaction.
3. Share the generated link, signature, or QR code with that recipient.
4. The recipient opens it with the matching wallet and redeems before the 37-day deadline.

Signatures are recipient-specific because that is what the contract verifies. A single public poster cannot safely authorize every scanner; for a live event, generate one QR per known attendee or use public minting for a shared QR.

## Architecture

```text
Browser or Farcaster host
        │
        ├── Next.js interface ── artwork studio, docs, gallery, creator tools
        │
        ├── Wagmi + Viem ─────── contract reads, wallet signatures, transactions
        │
        └── Base Sepolia ─────── verified ERC-1155 contract and onchain metadata
```

| Layer | Technology |
| --- | --- |
| Application | Next.js 15 App Router, React 19, strict TypeScript |
| Contract client | Wagmi and Viem |
| Query cache | TanStack Query |
| Wallets | EIP-6963, injected providers, MetaMask SDK, Coinbase Wallet, and Farcaster host wallet |
| Mini App | Farcaster Mini App SDK and Wagmi connector |
| QR generation | `qrcode` |
| Testing | Vitest and TypeScript compiler |

The frontend reads and writes directly to the contract. There is no custody layer, application database, private transaction relay, or server-held signing key.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Product overview and four newest events |
| `/create` | Artwork studio and contract registration |
| `/explore` | Searchable, paginated event collection |
| `/event/[id]` | Event metadata, mint availability, and verification |
| `/manage/[id]` | Creator-only controls, allowlists, batch minting, signatures, and QR codes |
| `/gallery` | POAPs held by the connected wallet |
| `/docs` | Organizer and developer documentation |
| `/api/og` | Generated social and Mini App preview image |
| `/.well-known/farcaster.json` | Signed Farcaster Mini App manifest |

## Run locally

### Requirements

- Node.js 20 or newer
- npm
- A browser wallet that supports Base Sepolia
- Base Sepolia test ETH for write operations

### Installation

```bash
git clone https://github.com/0x94t3z/onchain-poaps-studio.git
cd onchain-poaps-studio
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Contract reads work without a wallet.

## Configuration

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CONTRACT_ADDRESS=0xC3249356a483fbe17d5355D39105D2eA666d9de6
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Production | Exact canonical HTTPS origin used in metadata and the Mini App manifest |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Optional | Overrides the included Base Sepolia deployment |
| `NEXT_PUBLIC_RPC_URL` | Recommended | Base Sepolia RPC; use a dedicated provider for production traffic |
| `FARCASTER_HEADER` | Verified Mini App | Account-association header signed for the production hostname |
| `FARCASTER_PAYLOAD` | Verified Mini App | Account-association payload containing the production hostname |
| `FARCASTER_SIGNATURE` | Verified Mini App | Account-association signature |

Never put a private key, seed phrase, or server-only RPC secret in a `NEXT_PUBLIC_` variable. `.env.local` is ignored by Git.

### Wallet behavior

The standalone app discovers EIP-6963 and injected browser wallets and also supports MetaMask and Coinbase Wallet handoff. Inside a verified Farcaster host, the wallet chooser offers the native Farcaster wallet first, followed by MetaMask and Coinbase Wallet for users who prefer an external account. The selected connection is persisted across routes and restored after refresh. If the wallet is on another network, the UI requests Base Sepolia before contract interaction.

ENS primary names are resolved from Ethereum mainnet for display only; transactions remain on Base Sepolia. WalletConnect QR support is not configured, so `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is intentionally not part of the environment contract.

## Farcaster Mini App deployment

1. Deploy to the final HTTPS origin.
2. Set `NEXT_PUBLIC_APP_URL` to that exact origin and redeploy.
3. Verify `/icon-v2.png`, `/splash-v2.png`, `/api/og`, and `/.well-known/farcaster.json` return `200` publicly.
4. Open the [Farcaster Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest) and enter the hostname without a protocol or path.
5. Sign the account association with the owning Farcaster account.
6. Add the generated `header`, `payload`, and `signature` to the deployment environment.
7. Redeploy, validate the manifest, and test wallet and transaction flows inside the Farcaster client.

The signed domain must match exactly. `example.com`, `www.example.com`, and a preview deployment are different Mini App identities.

## Artwork and metadata

The contract stores raw SVG and returns Base64-encoded ERC-1155 metadata. Studio artwork is self-contained and has no remote images, fonts, or scripts. Custom SVG should include an explicit square `viewBox`, avoid remote dependencies, and be optimized before registration because every extra byte costs gas. The upload flow links to SVGOMG for optimization and reports the encoded size before approval.

## Cryptographic compatibility

### Signed mint payload

```text
keccak256(abi.encodePacked(eventId, chainId, recipient))
```

The creator signs the packed hash with `personal_sign`. The contract applies the Ethereum signed-message prefix and recovers the event creator. The signature is bound to one event, chain, and recipient.

### Allowlist construction

```text
leaf = keccak256(abi.encodePacked(address))
```

Leaves and node pairs are sorted lexicographically before hashing. An unpaired node is promoted unchanged. Addresses are checksummed and deduplicated. The exported JSON records the event, chain, contract, Merkle root, and proof for every recipient.

## Validation

```bash
npm run typecheck
npm test
npm run build
```

The automated suite verifies Merkle-tree compatibility. Contract transactions are tested against the actual Base Sepolia deployment rather than mocked. A release is not considered ready unless the production build completes and the manual transaction matrix below has been checked.

### Release checklist

- [x] The canonical HTTPS deployment, social image, and signed manifest return `200`.
- [x] Registration and public minting have succeeded against the real contract.
- [x] Registered artwork and metadata resolve from the contract.
- [x] Minted ownership is verifiable through BaseScan and OpenSea.
- [x] Type checking, tests, and the optimized production build pass locally.
- [ ] Deploy the latest reviewed commit to the canonical domain.
- [ ] Standalone wallet connection, refresh restoration, disconnect, and network switching work.
- [ ] Registration succeeds with built-in and custom SVG artwork.
- [ ] Public, allowlist, signed, and creator mint paths succeed against the real contract.
- [ ] Creator-only actions remain unavailable to disconnected and non-creator wallets.
- [ ] The signed Mini App manifest validates on the canonical domain.
- [ ] The Mini App is tested inside Farcaster on iOS and Android-sized viewports.
- [ ] Desktop layouts are checked in Chromium, Safari, and Firefox.
- [ ] A Farcaster launch cast includes the Mini App, standalone app, and GitHub links.

## Security and operational notes

- The app never requests or stores private keys.
- Every transaction is prepared client-side and requires explicit wallet approval.
- Creator permissions and deadlines are enforced by the contract; UI guards are an additional usability layer.
- Registration and the allowlist root are irreversible. The UI asks users to review and export required data first.
- RPC endpoints are public configuration. Use rate-limited, monitored infrastructure for sustained traffic.
- Review the verified contract independently before using a future mainnet deployment.

## License

Released under the [MIT License](./LICENSE).

The smart contract is maintained separately in [`jvaleskadevs/onchain-poaps`](https://github.com/jvaleskadevs/onchain-poaps).
