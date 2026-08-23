# Onchain POAPs Studio

A polished, open-source frontend for the [Onchain POAPs contract](https://github.com/jvaleskadevs/onchain-poaps). It runs as a standalone Next.js application and a Farcaster Mini App. Artwork and metadata are stored fully onchain on Base.

## Supported contract flows

- Register an event with every contract parameter and an SVG preview
- Public, Merkle allowlist, and ECDSA signature minting
- Creator batch minting (up to 101 recipients)
- One-time allowlist root setup with compatible proofs and JSON export
- Open/close public mint controls
- Recipient-bound signed passes and QR codes
- Owned-token gallery, decoded onchain metadata, BaseScan and OpenSea verification
- Plain-language docs covering protocol constraints and deadlines

The frontend does not modify or wrap the contract. Base Sepolia address: `0xC3249356a483fbe17d5355D39105D2eA666d9de6`.

## Local development

Requirements: Node.js 20+ and a browser wallet with Base Sepolia ETH.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. A WalletConnect project ID is optional; injected and Coinbase Wallet connectors work without it. Override the RPC URL if the public endpoint is rate-limited.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

Contract transactions are intentionally not mocked. Use Base Sepolia for end-to-end transaction testing.

## Deployment

Deploy to Vercel or any Node-compatible host and set:

- `NEXT_PUBLIC_APP_URL` — the canonical HTTPS deployment URL
- `NEXT_PUBLIC_RPC_URL` — Base Sepolia RPC
- `NEXT_PUBLIC_CONTRACT_ADDRESS` — optional contract override
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — optional
- `FARCASTER_HEADER`, `FARCASTER_PAYLOAD`, `FARCASTER_SIGNATURE` — generated account association values

The Mini App manifest is served at `/.well-known/farcaster.json`. Generate the account association in Farcaster’s Mini App tooling after the final domain is live, then add the three values above and redeploy. Test that the manifest, icon, image, wallet connection, and `sdk.actions.ready()` all work in the Farcaster preview tool.

## Signature scheme

The creator signs the raw 32-byte hash:

```text
keccak256(abi.encodePacked(eventId, chainId, recipient))
```

using `personal_sign`. The contract then applies the Ethereum signed-message prefix and recovers the creator. Passes are recipient-specific and valid through the contract’s 37-day window.

## Allowlist compatibility

Leaves are `keccak256(abi.encodePacked(address))`; leaves and node pairs are sorted lexicographically before hashing. Odd nodes are promoted unchanged. The exported JSON contains the root and proof for every normalized, deduplicated checksum address.

## License

MIT
