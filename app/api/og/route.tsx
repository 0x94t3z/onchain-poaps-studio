import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";

export async function GET() {
  const fonts = await loadOgFonts();
  const displayFont = fonts.some((font) => font.name === "Space Grotesk")
    ? "Space Grotesk"
    : "Arial";
  const bodyFont = fonts.some((font) => font.name === "DM Sans")
    ? "DM Sans"
    : "Arial";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#171717",
          color: "white",
          padding: "72px 88px",
          position: "relative",
          fontFamily: bodyFont,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 440,
            height: 440,
            borderRadius: 999,
            border: "2px solid #343434",
            top: -225,
            right: -80,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: 999,
            border: "46px solid #eeff41",
            opacity: 0.06,
            bottom: -150,
            left: -75,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontFamily: displayFont,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                border: "5px solid #eeff41",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: "#eeff41",
                  display: "flex",
                }}
              />
            </div>
            ONCHAIN POAPS
          </div>
          <div style={{ display: "flex", fontSize: 21, color: "#a8a8a2" }}>
            BUILT ON BASE
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            textAlign: "center",
            padding: "20px 0 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: displayFont,
              fontSize: 92,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -4,
            }}
          >
            Proof you were there.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              lineHeight: 1.35,
              color: "#bdbdb5",
              marginTop: 28,
            }}
          >
            Create, distribute and collect event POAPs onchain.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "#eeff41",
              color: "#171717",
              padding: "18px 28px",
              marginTop: 46,
              fontFamily: displayFont,
              fontSize: 24,
              fontWeight: 700,
              boxShadow: "9px 9px 0 #7357ff",
            }}
          >
            CREATE YOUR POAP
            <span style={{ display: "flex", fontSize: 30 }}>→</span>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 2,
            background: "#343434",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 800,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
