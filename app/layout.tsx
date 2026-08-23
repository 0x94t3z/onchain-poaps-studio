import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import { MiniAppReady } from "@/components/miniapp-ready";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Onchain POAPs",
  description: "Create, distribute and collect fully onchain POAPs on Base.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "1024x1024" },
    ],
    shortcut: "/icon.png",
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
      version: "next",
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
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
