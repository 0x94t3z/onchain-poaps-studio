# Onchain POAPs Studio

Onchain POAPs Studio is an open-source interface for creating and distributing ERC-1155 event tokens with artwork and metadata stored directly onchain. It works as both a responsive web application and a Farcaster Mini App.

> **Network status:** the current deployment uses **Base Sepolia** and test ETH. It does not use Base mainnet or real ETH.

## What the application supports

### Create

- Design compact SVG artwork in the built-in Badge Workshop.
- Choose between three layouts, five palettes, and four vector marks.
- Upload or paste a custom raw SVG instead of using the workshop.
- Preview artwork and its encoded byte size before registration.
- Register all supported event metadata and distribution settings.
- Create soulbound or transferable tokens.

### Distribute

- **Public mint:** any wallet may mint while the creator keeps it open.
- **Allowlist mint:** attendees submit contract-compatible Merkle proofs.
- **Signed mint:** the creator issues a recipient-specific signature or QR code.
- **Creator mint:** the creator mints directly to batches of up to 101 wallets.

### Manage and verify

- Open or close public minting during the creator control window.
- Set the allowlist root once and export recipient proofs as JSON.
- Generate signed mint links and QR codes without sending a transaction.
- Read event metadata and SVG artwork directly from the contract.
- Display tokens held by the connected wallet.
- Verify transactions and tokens through BaseScan and OpenSea testnets.
- Display a verified ENS primary name when the connected wallet has one.

## Contract deployment

| Item | Value |
| --- | --- |
| Network | Base Sepolia |
| Chain ID | `84532` |
| Contract | [`0xC3249356a483fbe17d5355D39105D2eA666d9de6`](https://sepolia.basescan.org/address/0xC3249356a483fbe17d5355D39105D2eA666d9de6#code) |
| Token standard | ERC-1155 |
| Upstream project | [jvaleskadevs/onchain-poaps](https://github.com/jvaleskadevs/onchain-poaps) |

This frontend calls the deployed contract directly. It does not proxy, wrap, or modify contract transactions.

## Contract rules reflected in the interface

- Each wallet can mint each event once across all mint methods.
- Event metadata, artwork, and the soulbound setting are immutable.
- Creators have 30 days after registration to toggle public minting, set the allowlist root, or creator-mint.
- A non-zero allowlist root can be set only once.
- Signed mints are available for 37 days after registration.
- Public and allowlist minting do not automatically expire at the contract level.
- Soulbound tokens cannot be transferred after minting.

Review the verified contract before relying on these rules for production use.

## Technology

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 App Router and React 19 |
| Language | TypeScript |
| Contract client | Wagmi and Viem |
| Data cache | TanStack Query |
| Mini App | Farcaster Mini App SDK and Wagmi connector |
| QR generation | `qrcode` |
| Tests | Vitest |

## Local development

### Requirements

- Node.js 20 or newer
- npm
- A browser wallet that supports Base Sepolia
- Base Sepolia test ETH for contract transactions

### Installation

```bash
git clone https://github.com/0x94t3z/onchain-poaps-studio.git
cd onchain-poaps-studio
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Contract reads work without connecting a wallet. Creating, minting, and managing events require a connected wallet and Base Sepolia test ETH.

## Environment variables

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
| `NEXT_PUBLIC_APP_URL` | Yes in production | Canonical application origin used by Mini App metadata and images. |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | No | Overrides the default Base Sepolia contract address. |
| `NEXT_PUBLIC_RPC_URL` | Recommended | Base Sepolia JSON-RPC endpoint. Use a dedicated provider for production traffic. |
| `FARCASTER_HEADER` | For verified Mini Apps | Signed account-association header. |
| `FARCASTER_PAYLOAD` | For verified Mini Apps | Signed account-association payload containing the domain. |
| `FARCASTER_SIGNATURE` | For verified Mini Apps | Signed account-association signature. |

Never place private keys, seed phrases, or RPC provider secrets in a `NEXT_PUBLIC_` variable. `.env.local` is ignored by Git.

### WalletConnect status

WalletConnect QR support is not currently configured. Adding `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` by itself has no effect until a WalletConnect connector is added to [`lib/wagmi.ts`](./lib/wagmi.ts). The current application supports:

- EIP-6963 wallets detected in the browser
- Generic injected browser wallets
- Coinbase Wallet
- The Farcaster host wallet inside a confirmed Mini App context

## Wallet behavior

The standalone website opens a custom wallet dialog and lists providers detected by Wagmi. Inside a confirmed Farcaster Mini App host, the application connects directly to the Farcaster wallet instead.

Connections time out after 30 seconds so a missing or unresponsive provider cannot leave the interface permanently loading. Once connected, the application requests Base Sepolia if the wallet is on another network.

ENS primary-name resolution is read from Ethereum mainnet and does not change the transaction network. When no verified primary name exists, the interface displays a shortened address.

## Farcaster Mini App setup

The manifest is generated at:

```text
https://your-domain.example/.well-known/farcaster.json
```

To associate a production domain with a Farcaster account:

1. Deploy the application to its final HTTPS domain.
2. Set `NEXT_PUBLIC_APP_URL` to that exact origin and redeploy.
3. Confirm `/.well-known/farcaster.json`, `/icon.png`, `/splash.png`, and `/api/og` are publicly accessible.
4. Open the [Farcaster Mini App Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest).
5. Enter the exact hostname without a protocol or path.
6. Sign the account association with the owning Farcaster account.
7. Copy its `header`, `payload`, and `signature` into the corresponding deployment environment variables.
8. Redeploy and confirm the manifest includes `accountAssociation`.

The signed hostname must match exactly. `example.com` and `www.example.com` are different Mini App domains.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Product overview and recent events |
| `/create` | Artwork workshop and event registration |
| `/explore` | All registered events |
| `/event/[id]` | Event metadata and mint methods |
| `/manage/[id]` | Creator controls, allowlists, batches, signatures, and QR codes |
| `/gallery` | POAPs held by the connected wallet |
| `/docs` | Organizer and developer instructions |
| `/api/og` | Generated social preview image |
| `/.well-known/farcaster.json` | Farcaster Mini App manifest |

## Artwork and metadata

The contract stores raw SVG data and exposes Base64-encoded ERC-1155 metadata. The workshop generates self-contained SVG without remote images, fonts, or scripts.

Custom artwork should:

- Include an explicit `viewBox`, preferably square.
- Avoid remote dependencies that wallets may block.
- Use paths when exact typography must render identically everywhere.
- Be optimized before registration because larger SVGs require more gas.

Registration is immutable. Always inspect the final preview before approving the transaction.

## Signature mint format

The creator signs this packed hash:

```text
keccak256(abi.encodePacked(eventId, chainId, recipient))
```

The wallet signs it with `personal_sign`. The contract applies the Ethereum signed-message prefix and recovers the event creator. A signature is bound to one event, chain, and recipient wallet, so it cannot be reused as a public claim code.

## Allowlist compatibility

The allowlist builder uses:

```text
leaf = keccak256(abi.encodePacked(address))
```

Leaves and node pairs are sorted lexicographically before hashing. An unpaired node is promoted unchanged. Inputs are normalized, checksummed, and deduplicated. The exported JSON contains the event information, Merkle root, and proof for each recipient.

Download the JSON before saving the root onchain. Recipients need their individual proof to mint, and the root cannot be replaced later.

## Validation

Run the complete local verification suite:

```bash
npm run typecheck
npm test
npm run build
```

The Vitest suite currently verifies Merkle-tree compatibility. Contract transactions are intentionally not mocked; perform end-to-end transaction checks on Base Sepolia.

The production build may print non-blocking warnings from transitive WalletConnect logging and Viem/Ox modules. The build must still finish successfully before deployment.

## Deployment checklist

- [ ] Production environment variables are configured.
- [ ] The production URL uses HTTPS and matches `NEXT_PUBLIC_APP_URL`.
- [ ] A reliable Base Sepolia RPC endpoint is configured.
- [ ] `npm run typecheck`, `npm test`, and `npm run build` pass.
- [ ] Wallet connection works in a standalone browser.
- [ ] Base Sepolia switching works.
- [ ] Create, public mint, allowlist mint, signed mint, and creator mint are tested.
- [ ] SVG and metadata resolve from the contract after registration.
- [ ] The Mini App manifest and account association validate on the final domain.
- [ ] The application is tested inside the intended Farcaster host.
- [ ] Mobile layouts are checked on iOS and Android-sized viewports.

## License

[MIT](./LICENSE)
