"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  Copy,
  LogOut,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { chain } from "@/lib/constants";
import { getPrimaryEnsName } from "@/lib/ens";
import { short } from "@/lib/metadata";
import { walletConnectConfigured } from "@/lib/wagmi";

const CONNECT_TIMEOUT = 30_000;
const BUILT_IN_CONNECTORS = new Set(["farcaster", "injected", "walletConnect"]);
const EVM_BROWSER_CONNECTOR_TYPE = "injected";
const FEATURED_EVM_WALLET_NAMES = new Set(["metamask", "phantom"]);
const FEATURED_EVM_WALLET_RDNS = new Set([
  "io.metamask",
  "io.metamask.mobile",
  "app.phantom",
]);

function isFeaturedEvmWallet({
  name,
  rdns,
}: {
  name: string;
  rdns?: string | readonly string[];
}) {
  const identifiers = Array.isArray(rdns) ? rdns : rdns ? [rdns] : [];
  return (
    FEATURED_EVM_WALLET_NAMES.has(name.trim().toLowerCase()) ||
    identifiers.some((identifier) => FEATURED_EVM_WALLET_RDNS.has(identifier))
  );
}

function formatEnsName(name: string, maxLength = 24) {
  if (name.length <= maxLength) return name;
  const tailLength = 11;
  const headLength = maxLength - tailLength - 1;
  return `${name.slice(0, headLength)}…${name.slice(-tailLength)}`;
}

export function WalletButton() {
  const { address, isConnected, isReconnecting, chainId } = useAccount();
  const { data: ensName } = useQuery({
    queryKey: ["ens-primary-name", address],
    queryFn: () => getPrimaryEnsName(address!),
    enabled: Boolean(address),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  const { open: openAppKit } = useAppKit();
  const { connectAsync, connectors, isPending, error, reset } = useConnect();
  const { disconnect, disconnectAsync } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    import("@farcaster/miniapp-sdk")
      .then(({ sdk }) => sdk.isInMiniApp())
      .then((inside) => active && setIsMiniApp(inside))
      .catch(() => active && setIsMiniApp(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, isPending]);

  useEffect(() => {
    if (!isAccountOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountOpen]);

  useEffect(() => {
    if (!address) setIsAccountOpen(false);
  }, [address]);

  const walletOptions = useMemo(() => {
    // EIP-6963 wallets are exposed by Wagmi as injected EVM connectors.
    // Filtering on the connector type prevents unrelated connector families
    // from appearing in the direct browser-wallet list.
    const discovered = connectors.filter(
      (connector) =>
        connector.type === EVM_BROWSER_CONNECTOR_TYPE &&
        !BUILT_IN_CONNECTORS.has(connector.id) &&
        isFeaturedEvmWallet(connector),
    );
    const fixed = (id: string) => connectors.filter((item) => item.id === id);
    const candidates = isMiniApp ? fixed("farcaster") : discovered;
    return candidates.filter(
      (connector, index) =>
        candidates.findIndex(
          (candidate) =>
            candidate.id === connector.id && candidate.name === connector.name,
        ) === index,
    );
  }, [connectors, isMiniApp]);

  async function requestConnection(connector: (typeof connectors)[number]) {
    let timer = 0;
    try {
      return await Promise.race([
        connectAsync({ connector, chainId: chain.id }),
        new Promise<never>((_, reject) => {
          timer = window.setTimeout(
            () => reject(new Error("Wallet connection timed out")),
            CONNECT_TIMEOUT,
          );
        }),
      ]);
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function connectWallet(connectorId: string) {
    reset();
    setConnectionError("");
    const connector = connectors.find(({ id }) => id === connectorId);
    if (!connector) {
      setConnectionError(
        "That wallet is no longer available. Reopen the dialog.",
      );
      return;
    }

    try {
      await requestConnection(connector);
      setIsOpen(false);
    } catch (reason) {
      let failure = reason;
      const initialMessage = reason instanceof Error ? reason.message : "";

      if (/connector already connected/i.test(initialMessage)) {
        try {
          await disconnectAsync({ connector });
          reset();
          await requestConnection(connector);
          setIsOpen(false);
          return;
        } catch (retryReason) {
          failure = retryReason;
        }
      }

      reset();
      const message = failure instanceof Error ? failure.message : "";
      console.error("Wallet connection failed", failure);
      setConnectionError(
        /rejected|denied|cancelled/i.test(message)
          ? "Connection cancelled in the wallet."
          : /already pending|already processing|resource unavailable|-32002/i.test(
                message,
              )
            ? "Your wallet already has a connection request open. Open the wallet to continue."
            : /chain.*not configured|unsupported chain|unrecognized chain/i.test(
                  message,
                )
              ? "Base Sepolia is not available in this wallet. Add or enable the network, then try again."
              : /provider not found|connector not found/i.test(message)
                ? "The selected wallet is no longer available. Reload the page and try again."
                : /timed out/i.test(message)
                  ? "The wallet did not respond. Try another option."
                  : `Could not connect: ${message || "unknown wallet error"}`,
      );
    }
  }

  async function openAllWallets() {
    reset();
    setConnectionError("");
    setIsOpen(false);
    try {
      await openAppKit({ view: "AllWallets", namespace: "eip155" });
    } catch (reason) {
      console.error("WalletConnect wallet list failed to open", reason);
      setConnectionError(
        "The wallet list could not open. Reload the page and try again.",
      );
    }
  }

  function openConnection() {
    reset();
    setConnectionError("");
    setIsOpen(true);
  }

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setAddressCopied(true);
    window.setTimeout(() => setAddressCopied(false), 1800);
  }

  if (isConnected && address) {
    return chainId !== chain.id ? (
      <button
        className="button warn"
        onClick={() => switchChain({ chainId: chain.id })}
      >
        Switch to Base Sepolia
      </button>
    ) : (
      <div className="wallet-connect" ref={accountMenuRef}>
        <button
          className="button secondary wallet-identity"
          title={ensName ? `${ensName} · ${address}` : address}
          aria-label={
            ensName
              ? `Connected as ${ensName}. Open account menu.`
              : `Connected as ${address}. Open account menu.`
          }
          aria-haspopup="menu"
          aria-expanded={isAccountOpen}
          onClick={() => setIsAccountOpen((open) => !open)}
        >
          <span>{ensName ? formatEnsName(ensName) : short(address)}</span>
          <ChevronDown aria-hidden="true" />
        </button>

        {isAccountOpen && (
          <div className="wallet-account-menu" role="menu">
            <div className="wallet-account-summary">
              <span className="eyebrow">CONNECTED WALLET</span>
              {ensName && <strong>{formatEnsName(ensName, 30)}</strong>}
              <code title={address}>{address}</code>
            </div>
            <button role="menuitem" onClick={copyAddress}>
              {addressCopied ? <Check /> : <Copy />}
              <span>{addressCopied ? "Address copied" : "Copy address"}</span>
            </button>
            <button
              className="wallet-disconnect"
              role="menuitem"
              onClick={() => {
                setIsAccountOpen(false);
                disconnect();
              }}
            >
              <LogOut />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        className="button"
        disabled={isPending || isReconnecting || isMiniApp === null}
        aria-haspopup="dialog"
        onClick={openConnection}
      >
        {isReconnecting
          ? "Restoring wallet…"
          : isPending
            ? "Connecting…"
            : "Connect wallet"}
      </button>

      {connectionError && !isOpen && (
        <span className="wallet-error" role="alert">
          {connectionError}
        </span>
      )}

      {isOpen &&
        createPortal(
          <div
            className="wallet-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isPending)
                setIsOpen(false);
            }}
          >
            <section
              className="wallet-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="wallet-modal-title"
            >
              <div className="wallet-modal-header">
                <div>
                  <span className="eyebrow">BASE SEPOLIA</span>
                  <h2 id="wallet-modal-title">Choose a wallet</h2>
                </div>
                <button
                  className="wallet-close"
                  aria-label="Close wallet dialog"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                >
                  <X />
                </button>
              </div>

              <div className="wallet-modal-body">
                <div className="wallet-list">
                  {walletOptions.length > 0 && (
                    <span className="wallet-section-label">
                      {isMiniApp ? "FARCASTER WALLET" : "DETECTED WALLETS"}
                    </span>
                  )}
                  {walletOptions.map((connector) => (
                    <button
                      key={`${connector.id}-${connector.name}`}
                      disabled={isPending}
                      onClick={() => connectWallet(connector.id)}
                    >
                      <span className="wallet-icon">
                        {connector.icon ? (
                          <img src={connector.icon} alt="" />
                        ) : (
                          connector.name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <span>
                        <strong>{connector.name}</strong>
                        <small>
                          {connector.id === "farcaster"
                            ? "Recommended in Farcaster"
                            : "Detected in this browser"}
                        </small>
                      </span>
                      <b>{isPending ? "Waiting…" : "Connect →"}</b>
                    </button>
                  ))}
                  {walletConnectConfigured && (
                    <>
                      <span
                        className={`wallet-section-label${
                          walletOptions.length > 0
                            ? " wallet-section-label-separated"
                            : ""
                        }`}
                      >
                        MORE WALLETS
                      </span>
                      <button disabled={isPending} onClick={openAllWallets}>
                        <span className="wallet-icon">
                          <img src="/walletconnect.svg" alt="" />
                        </span>
                        <span>
                          <strong>WalletConnect</strong>
                          <small>Choose from all compatible EVM wallets</small>
                        </span>
                        <b>Choose →</b>
                      </button>
                    </>
                  )}
                  {walletOptions.length === 0 && !walletConnectConfigured && (
                    <div className="wallet-empty">
                      No browser wallet was detected. Add a WalletConnect project
                      ID or install a compatible wallet, then reload.
                    </div>
                  )}
                  {(connectionError || error) && (
                    <p className="wallet-modal-error" role="alert">
                      {connectionError || "The wallet could not connect."}
                    </p>
                  )}
                </div>

                <aside className="wallet-help">
                  <WalletCards />
                  <h3>Your wallet approves every action</h3>
                  <p>
                    This app can request a connection and prepare transactions.
                    Nothing is sent until you approve it in your wallet.
                  </p>
                  <div>
                    <ShieldCheck />
                    <span>
                      <strong>Test network</strong>
                      <small>
                        Creating or minting requires Base Sepolia test ETH, not
                        real ETH.
                      </small>
                    </span>
                  </div>
                </aside>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}
