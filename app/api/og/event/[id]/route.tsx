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
      const [event, uri] = await Promise.all([
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
      const metadata = decodeMetadata(uri);
      name = metadata.name || event[0] || name;
      description = metadata.description || event[1] || description;
      artwork = metadata.image;
      soulbound = event[9];
      publicMint = event[10];
    } catch {
      // The branded fallback remains shareable during a transient RPC failure.
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#171717",
          color: "#f4f2e9",
          padding: 58,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 684,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "18px 54px 14px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div
              style={{
                width: 42,
                height: 42,
                border: "5px solid #eeff41",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#eeff41",
                  display: "flex",
                }}
              />
            </div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: 2 }}>
              ONCHAIN POAPS
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#eeff41", fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>
              {publicMint ? "OPEN MINT" : "GATED"} · {soulbound ? "SOULBOUND" : "TRANSFERABLE"}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: name.length > 32 ? 48 : 62,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: -2,
                marginTop: 18,
                maxHeight: 190,
                overflow: "hidden",
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: "flex",
                color: "#bdbdb5",
                fontSize: 24,
                lineHeight: 1.35,
                marginTop: 22,
                maxHeight: 68,
                overflow: "hidden",
              }}
            >
              {description}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 800 }}>
            VIEW & MINT POAP #{id.padStart(3, "0")} →
          </div>
        </div>
        <div
          style={{
            width: 400,
            height: 400,
            alignSelf: "center",
            background: "#242424",
            border: "1px solid #484842",
            boxShadow: "14px 14px 0 #7357ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {artwork ? (
            <img
              src={artwork}
              alt=""
              width="400"
              height="400"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: 210,
                height: 210,
                borderRadius: 999,
                border: "22px solid #eeff41",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "#eeff41", display: "flex" }} />
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
