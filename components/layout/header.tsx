"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const WalletButton = dynamic(
  () =>
    import("@/features/wallet/wallet-button").then(
      (module) => module.WalletButton,
    ),
  {
    loading: () => (
      <button className="button wallet-connect-trigger" type="button" disabled>
        <span>Connect</span>
      </button>
    ),
    ssr: false,
  },
);

const links = [
  ["/explore", "Explore"],
  ["/create", "Create"],
  ["/gallery", "My POAPs"],
  ["/docs", "Docs"],
];
export function Header() {
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      links.forEach(([href]) => router.prefetch(href));
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [router]);

  const navigation = (className: string) => (
    <nav className={className} aria-label="Primary navigation">
      {links.map(([href, label]) => (
        <Link
          className={path.startsWith(href) ? "active" : ""}
          key={href}
          href={href}
          onFocus={() => router.prefetch(href)}
          onPointerEnter={() => router.prefetch(href)}
          prefetch
        >
          {label}
        </Link>
      ))}
    </nav>
  );
  return (
    <>
      <header>
        <Link href="/" className="brand" aria-label="Onchain POAPs home">
          <span className="brandmark">O</span>
          <span>
            ONCHAIN
            <br />
            POAPS
          </span>
        </Link>
        {navigation("desktop-nav")}
        <div className="header-actions">
          <ThemeToggle />
          <WalletButton label="Connect" />
        </div>
      </header>
      {navigation("mobile-nav")}
    </>
  );
}
