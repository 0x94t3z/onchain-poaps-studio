import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import { MiniAppReady } from "@/components/miniapp-ready";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const themeScript = `(()=>{try{const key="onchain-poaps-theme";const saved=localStorage.getItem(key);const theme=saved==="light"||saved==="dark"?saved:"light";document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;document.querySelector("#theme-favicon")?.setAttribute("href",theme==="dark"?"/icon-dark.svg":"/icon.svg");document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme==="dark"?"#11120f":"#f4f2e9")}catch{document.documentElement.dataset.theme="light"}})()`;
export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Onchain POAPs",
  description: "Create, distribute and collect fully onchain POAPs on Base.",
  icons: {
    apple: [{ url: "/icon.png", sizes: "1024x1024" }],
  },
  openGraph: {
    title: "Onchain POAPs",
    description:
      "Create and distribute ERC-1155 attendance tokens with SVG artwork stored on Base.",
    images: ["/api/og"],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${appUrl}/api/og`,
      button: {
        title: "Open Onchain POAPs",
        action: {
          type: "launch_miniapp",
          name: "Onchain POAPs",
          url: appUrl,
          splashImageUrl: `${appUrl}/splash-v2.png`,
          splashBackgroundColor: "#eeff41",
        },
      },
    }),
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: `${appUrl}/api/og`,
      button: {
        title: "Open Onchain POAPs",
        action: {
          type: "launch_frame",
          name: "Onchain POAPs",
          url: appUrl,
          splashImageUrl: `${appUrl}/splash-v2.png`,
          splashBackgroundColor: "#eeff41",
        },
      },
    }),
  },
};
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#f4f2e9",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link id="theme-favicon" rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <MiniAppReady />
          <Header />
          <main>{children}</main>
          <footer>
            <span>ONCHAIN POAPS · BASE SEPOLIA</span>
            <span>Create, distribute and collect attendance onchain.</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
