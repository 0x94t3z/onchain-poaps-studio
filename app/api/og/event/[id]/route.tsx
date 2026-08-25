import { ImageResponse } from "next/og";
import { poapAbi } from "@/lib/abi";
import { CONTRACT } from "@/lib/constants";
import { decodeMetadata } from "@/lib/metadata";
import { publicClient } from "@/lib/public-client";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const validId = /^[1-9]\d*$/.test(id);
  let name = `Onchain POAP #${id}`;
  let description = "A fully onchain event credential on Base.";
  let artwork: string | null = null;
  let publicMint = false;
  let soulbound = true;

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
        const event = eventResult.value;
        name = event[0] || name;
        description = event[1] || description;
        soulbound = event[9];
        publicMint = event[10];
      }

      if (uriResult.status === "fulfilled") {
        try {
          const metadata = decodeMetadata(uriResult.value);
          name = metadata.name || name;
          description = metadata.description || description;
          artwork = metadata.image || artwork;
        } catch {
          // Event data still provides a useful card when token metadata is malformed.
        }
      }
    } catch {
      // The branded fallback remains shareable during a transient RPC failure.
    }
  }

  const titleSize = name.length > 44 ? 46 : name.length > 28 ? 54 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f2e9",
          color: "#171717",
          padding: 64,
          fontFamily: "Arial, sans-serif",
          alignItems: "center",
          gap: 64,
        }}
      >
        <div
          style={{
            width: 500,
            height: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#faf9f4",
            border: "2px solid #171717",
            boxShadow: "14px 14px 0 #eeff41",
            overflow: "hidden",
          }}
        >
          {artwork ? (
            <img src={artwork} alt="" width="500" height="500" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <div
              style={{
                width: 210,
                height: 210,
                border: "22px solid #171717",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "#171717", display: "flex" }} />
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            height: 500,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#7357ff", fontSize: 19, fontWeight: 700, letterSpacing: 2 }}>
              {publicMint ? "OPEN MINT" : "GATED"} · BASE SEPOLIA · {soulbound ? "SOULBOUND" : "TRANSFERABLE"}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: titleSize,
                lineHeight: 1.04,
                fontWeight: 800,
                letterSpacing: -2,
                marginTop: 20,
                maxHeight: 205,
                overflow: "hidden",
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: "flex",
                color: "#69685f",
                fontSize: 23,
                lineHeight: 1.35,
                marginTop: 24,
                maxHeight: 94,
                overflow: "hidden",
              }}
            >
              {description}
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 38, alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", background: "#171717", color: "#fff", padding: "18px 26px", fontSize: 19, fontWeight: 800, boxShadow: "7px 7px 0 #eeff41" }}>
              VIEW &amp; MINT POAP #{id.padStart(3, "0")} →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
