"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./wallet-button";
const links = [
  ["/explore", "Explore"],
  ["/create", "Create"],
  ["/gallery", "Gallery"],
  ["/docs", "Docs"],
];
export function Header() {
  const path = usePathname();
  const navigation = (className: string) => (
    <nav className={className} aria-label="Primary navigation">
      {links.map(([href, label]) => (
        <Link
          className={path.startsWith(href) ? "active" : ""}
          key={href}
          href={href}
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
        <WalletButton />
      </header>
      {navigation("mobile-nav")}
    </>
  );
}
