"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, WalletCards, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { chain } from "@/lib/constants";
import { getPrimaryEnsName } from "@/lib/ens";
import { short } from "@/lib/metadata";

const CONNECT_TIMEOUT = 30_000;
const BUILT_IN_CONNECTORS = new Set([
  "farcaster",
  "injected",
  "coinbaseWalletSDK",
]);

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { data: ensName } = useQuery({
    queryKey: ["ens-primary-name", address],
    queryFn: () => getPrimaryEnsName(address!),
    enabled: Boolean(address),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  const { connectAsync, connectors, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [connectionError, setConnectionError] = useState("");

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

  const walletOptions = useMemo(() => {
    const hasInjectedWallet =
      typeof window !== "undefined" && "ethereum" in window;
    const discovered = connectors.filter(
      ({ id }) => !BUILT_IN_CONNECTORS.has(id),
    );
    const candidates = [
      ...discovered,
      ...(hasInjectedWallet && discovered.length === 0
        ? connectors.filter(({ id }) => id === "injected")
        : []),
      ...connectors.filter(({ id }) => id === "coinbaseWalletSDK"),
    ];
    return candidates.filter(
      (connector, index) =>
        candidates.findIndex(
          (candidate) =>
            candidate.id === connector.id && candidate.name === connector.name,
        ) === index,
    );
  }, [connectors]);

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

    let timer = 0;
    try {
      await Promise.race([
        connectAsync({ connector }),
        new Promise<never>((_, reject) => {
          timer = window.setTimeout(
            () => reject(new Error("Wallet connection timed out")),
            CONNECT_TIMEOUT,
          );
        }),
      ]);
      setIsOpen(false);
    } catch (reason) {
      reset();
      const message = reason instanceof Error ? reason.message : "";
      setConnectionError(
        /rejected|denied|cancelled/i.test(message)
          ? "Connection cancelled in the wallet."
          : /timed out/i.test(message)
            ? "The wallet did not respond. Try another option."
            : "Could not connect. Unlock your wallet and try again.",
      );
    } finally {
      window.clearTimeout(timer);
    }
  }

  function openConnection() {
    setConnectionError("");
    if (isMiniApp) {
      void connectWallet("farcaster");
      return;
    }
    setIsOpen(true);
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
      <button
        className="button secondary wallet-identity"
        title={address}
        onClick={() => disconnect()}
      >
        {ensName || short(address)}
      </button>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        className="button"
        disabled={isPending || isMiniApp === null}
        aria-haspopup={isMiniApp ? undefined : "dialog"}
        onClick={openConnection}
      >
        {isPending ? "Connecting…" : "Connect wallet"}
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
                  <span className="wallet-section-label">
                    {walletOptions.length > 1 ? "AVAILABLE WALLETS" : "WALLET"}
                  </span>
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
                          {connector.id === "coinbaseWalletSDK"
                            ? "Extension or mobile app"
                            : "Detected in this browser"}
                        </small>
                      </span>
                      <b>{isPending ? "Waiting…" : "Connect →"}</b>
                    </button>
                  ))}
                  {walletOptions.length === 0 && (
                    <div className="wallet-empty">
                      No browser wallet was detected. Install a Base-compatible
                      wallet, then reload this page.
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
