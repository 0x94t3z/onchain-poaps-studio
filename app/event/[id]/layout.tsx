import type { Metadata } from "next";
import { poapAbi } from "@/lib/abi";
import { CONTRACT } from "@/lib/constants";
import { decodeMetadata } from "@/lib/metadata";
import { publicClient } from "@/lib/public-client";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

function miniAppEmbed(eventUrl: string, imageUrl: string) {
  return {
    version: "1",
    imageUrl,
    button: {
      title: "View & mint POAP",
      action: {
        type: "launch_miniapp",
        name: "Onchain POAPs",
        url: eventUrl,
        splashImageUrl: `${appUrl}/splash-v2.png`,
        splashBackgroundColor: "#eeff41",
      },
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const validId = /^[1-9]\d*$/.test(id);
  const eventUrl = `${appUrl}/event/${id}`;
  const imageUrl = `${appUrl}/api/og/event/${id}?v=3`;
  let name = `POAP #${id}`;
  let description = "View and mint this fully onchain POAP on Base.";

  if (validId) {
    try {
      const eventId = BigInt(id);
      const [eventResult, uriResult] = await Promise.allSettled([
        publicClient.readContract({
          address: CONTRACT,
          abi: poapAbi,
          functionName: "events",
          args: [eventId],
        }),
        publicClient.readContract({
          address: CONTRACT,
          abi: poapAbi,
          functionName: "uri",
          args: [eventId],
        }),
      ]);

      if (eventResult.status === "fulfilled") {
        name = eventResult.value[0] || name;
        description = eventResult.value[1] || description;
      }

      if (uriResult.status === "fulfilled") {
        try {
          const eventMetadata = decodeMetadata(uriResult.value);
          name = eventMetadata.name || name;
          description = eventMetadata.description || description;
        } catch {
          // Contract event data remains available when token metadata is malformed.
        }
      }
    } catch {
      // Keep a useful share card even if the public RPC is briefly unavailable.
    }
  }

  const miniapp = miniAppEmbed(eventUrl, imageUrl);
  const frame = {
    ...miniapp,
    button: {
      ...miniapp.button,
      action: { ...miniapp.button.action, type: "launch_frame" },
    },
  };

  return {
    title: `${name} | Onchain POAPs`,
    description,
    alternates: { canonical: eventUrl },
    openGraph: {
      title: name,
      description,
      url: eventUrl,
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 800, alt: name }],
    },
    other: {
      "fc:miniapp": JSON.stringify(miniapp),
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
