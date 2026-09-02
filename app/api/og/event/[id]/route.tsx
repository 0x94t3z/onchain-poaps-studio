import { ImageResponse } from "next/og";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { poapAbi } from "@/lib/blockchain/abi";
import { CONTRACT } from "@/lib/blockchain/constants";
import { decodeMetadata } from "@/lib/metadata/metadata";
import { loadOgFonts, type OgFont } from "@/lib/og/og-fonts";
import { publicClient } from "@/lib/blockchain/public-client";

export const runtime = "nodejs";

let rasterFontFilesCache: {
  key: string;
  promise: Promise<string[]>;
} | null = null;

async function rasterFontFiles(fonts: OgFont[]) {
  const key = fonts.map((font) => font.name).sort().join("|");
  if (!rasterFontFilesCache || rasterFontFilesCache.key !== key) {
    const promise = Promise.all(
      fonts.map(async (font) => {
        const filename =
          font.name === "Space Grotesk"
            ? "onchain-poaps-space-grotesk-bold.ttf"
            : "onchain-poaps-dm-sans-regular.ttf";
        const path = join(tmpdir(), filename);
        await writeFile(path, new Uint8Array(font.data));
        return path;
      }),
    ).catch((reason) => {
      rasterFontFilesCache = null;
      throw reason;
    });
    rasterFontFilesCache = { key, promise };
  }

  return rasterFontFilesCache.promise;
}

async function rasterizeArtwork(image: string | null, fonts: OgFont[]) {
  const prefix = "data:image/svg+xml;base64,";
  if (!image?.startsWith(prefix)) return image;
  if (fonts.length === 0) return image;

  try {
    const preferredFont = fonts.some((font) => font.name === "Space Grotesk")
      ? "Space Grotesk"
      : fonts[0].name;
    const svg = Buffer.from(image.slice(prefix.length), "base64")
      .toString("utf8")
      .replace(
        /font-family=(["'])Arial,sans-serif\1/g,
        `font-family="${preferredFont}"`,
      )
      .replace(
        /font-family=(["'])sans-serif\1/g,
        `font-family="${preferredFont}"`,
      );
    const fontFiles = await rasterFontFiles(fonts);
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: 548 },
      font: {
        fontFiles,
        loadSystemFonts: false,
        defaultFontFamily: preferredFont,
        sansSerifFamily: preferredFont,
      },
    })
      .render()
      .asPng();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return image;
  }
}

function formatEventDate(timestamp: bigint) {
  if (timestamp <= 0n) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Number(timestamp) * 1000));
}

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
  let eventDate = 0n;
  let location = "";
  let loadedEvent = false;

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
        eventDate = event[2];
        location = event[3];
        soulbound = event[9];
        publicMint = event[10];
        loadedEvent = true;
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

  const fonts = await loadOgFonts();
  const renderedArtwork = await rasterizeArtwork(artwork, fonts);
  const hasDisplayFont = fonts.some((font) => font.name === "Space Grotesk");
  const hasBodyFont = fonts.some((font) => font.name === "DM Sans");
  const displayFont = hasDisplayFont ? "Space Grotesk" : "Arial";
  const bodyFont = hasBodyFont ? "DM Sans" : "Arial";
  const titleSize = name.length > 50 ? 48 : name.length > 32 ? 56 : 68;
  const date = formatEventDate(eventDate);
  const facts = [
    date,
    location,
    soulbound ? "Soulbound" : "Transferable",
  ].filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f2e9",
          color: "#171717",
          padding: 40,
          fontFamily: bodyFont,
          alignItems: "center",
          gap: 58,
        }}
      >
        <div
          style={{
            width: 548,
            height: 548,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: "#171717",
            overflow: "hidden",
          }}
        >
          {renderedArtwork ? (
            <img
              src={renderedArtwork}
              alt=""
              width="548"
              height="548"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: 210,
                height: 210,
                border: "22px solid #eeff41",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "#eeff41", display: "flex" }} />
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: 18,
              bottom: 18,
              display: "flex",
              padding: "8px 11px",
              background: "#eeff41",
              color: "#171717",
              fontFamily: bodyFont,
              fontSize: 19,
            }}
          >
            #{id.padStart(3, "0")}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            height: 548,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: displayFont,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2.2,
              }}
            >
              {publicMint ? "OPEN MINT" : "GATED"} · BASE SEPOLIA
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: displayFont,
                fontSize: titleSize,
                lineHeight: 0.93,
                fontWeight: 700,
                letterSpacing: -3,
                marginTop: 28,
                maxHeight: 196,
                overflow: "hidden",
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: "flex",
                color: "#69685f",
                fontFamily: bodyFont,
                fontSize: 21,
                lineHeight: 1.35,
                marginTop: 28,
                maxHeight: 84,
                overflow: "hidden",
              }}
            >
              {description}
            </div>
          </div>
          {facts.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                color: "#3f3f3b",
                fontFamily: bodyFont,
                fontSize: 16,
                marginTop: 30,
                gap: 11,
              }}
            >
              {facts.map((fact, index) => (
                <div key={fact} style={{ display: "flex" }}>
                  {index > 0 ? `· ${fact}` : fact}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", marginTop: 34, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: "#171717",
                color: "#fff",
                padding: "16px 24px",
                fontFamily: displayFont,
                fontSize: 17,
                fontWeight: 700,
                boxShadow: "6px 6px 0 #eeff41",
              }}
            >
              VIEW &amp; MINT POAP →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
      fonts,
      headers: {
        "Cache-Control": loadedEvent && renderedArtwork
          ? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
          : "no-store, max-age=0",
      },
    },
  );
}
