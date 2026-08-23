import { NextResponse } from "next/server";
export function GET() {
  const url = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const association =
    process.env.FARCASTER_HEADER &&
    process.env.FARCASTER_PAYLOAD &&
    process.env.FARCASTER_SIGNATURE
      ? {
          accountAssociation: {
            header: process.env.FARCASTER_HEADER,
            payload: process.env.FARCASTER_PAYLOAD,
            signature: process.env.FARCASTER_SIGNATURE,
          },
        }
      : {};
  return NextResponse.json({
    ...association,
    miniapp: {
      version: "1",
      name: "Onchain POAPs",
      homeUrl: url,
      iconUrl: `${url}/icon-v2.png`,
      splashImageUrl: `${url}/splash-v2.png`,
      splashBackgroundColor: "#eeff41",
      subtitle: "Create and mint event POAPs",
      description:
        "Create, distribute, and collect ERC-1155 event POAPs on Base.",
      primaryCategory: "art-creativity",
      tags: ["poap", "base", "events", "onchain"],
      heroImageUrl: `${url}/api/og`,
      tagline: "Event POAPs stored on Base",
      ogTitle: "Onchain POAPs",
      ogDescription: "Create and mint ERC-1155 event POAPs on Base.",
      ogImageUrl: `${url}/api/og`,
      canonicalDomain: new URL(url).hostname,
      requiredChains: ["eip155:84532"],
      requiredCapabilities: ["wallet.getEthereumProvider"],
    },
  });
}
