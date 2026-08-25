"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Settings2, Share2 } from "lucide-react";

function FarcasterIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="share-brand-icon"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
    >
      <rect width="28" height="28" rx="6" fill="#855DCD" />
      <path
        d="M7 7h14l-1.4 4.2v7.3H22V22h-7v-3.5h1.8v-5.1a2.8 2.8 0 0 0-5.6 0v5.1H13V22H6v-3.5h2.4v-7.3L7 7Z"
        fill="white"
      />
    </svg>
  );
}

function XIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="share-brand-icon share-brand-icon-x"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
    >
      <rect width="28" height="28" rx="6" fill="#050505" />
      <path
        d="M7.4 7h4.55l3.22 4.3L18.84 7h1.77l-4.63 5.43L21 19h-4.54l-3.55-4.67L8.93 19H7.16l4.94-5.8L7.4 7Zm3.68 1.55h-1.2l7.44 8.9h1.18l-7.42-8.9Z"
        fill="white"
      />
    </svg>
  );
}

function eventUrl(eventId: string) {
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const base = configuredBase || window.location.origin;
  return `${base}/event/${eventId}`;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

export function EventShareActions({
  eventId,
  eventName,
  compact = false,
  manageHref,
}: {
  eventId: string;
  eventName: string;
  compact?: boolean;
  manageHref?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sharingTarget, setSharingTarget] = useState<"farcaster" | "x" | null>(
    null,
  );
  const menuId = useId();
  const shareActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!shareActionsRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  async function copyClaimLink() {
    await copyText(eventUrl(eventId));
    setCopied(true);
    setIsOpen(false);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareOnFarcaster() {
    const url = eventUrl(eventId);
    const text = `View ${eventName || "this POAP"} on Onchain POAPs.`;
    setSharingTarget("farcaster");

    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      if (await sdk.isInMiniApp()) {
        await sdk.actions.composeCast({
          text,
          embeds: [url],
        });
        return;
      }

      const composer = new URL("https://farcaster.xyz/~/compose");
      composer.searchParams.set("text", text);
      composer.searchParams.append("embeds[]", url);
      window.open(composer.toString(), "_blank", "noopener,noreferrer");
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      const composer = new URL("https://farcaster.xyz/~/compose");
      composer.searchParams.set("text", text);
      composer.searchParams.append("embeds[]", url);
      window.open(composer.toString(), "_blank", "noopener,noreferrer");
    } finally {
      setSharingTarget(null);
      setIsOpen(false);
    }
  }

  function shareOnX() {
    const url = eventUrl(eventId);
    const text = `View ${eventName || "this POAP"} on Onchain POAPs.`;
    const composer = new URL("https://x.com/intent/post");
    composer.searchParams.set("text", `${text}\n${url}`);
    setSharingTarget("x");
    window.open(composer.toString(), "_blank", "noopener,noreferrer");
    setSharingTarget(null);
    setIsOpen(false);
  }

  return (
    <div
      ref={shareActionsRef}
      className={`event-share-actions${compact ? " event-share-actions-compact" : ""}${manageHref ? " event-share-actions-with-manage" : ""}`}
    >
      {!compact && manageHref && (
        <Link className="button secondary event-manage-button" href={manageHref}>
          <Settings2 size={17} aria-hidden="true" />
          Manage event
        </Link>
      )}
      <button
        type="button"
        className={compact ? "event-share-icon" : "button"}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Share ${eventName || `POAP #${eventId}`}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title="Share POAP"
      >
        {copied && compact ? (
          <Check size={18} aria-hidden="true" />
        ) : (
          <Share2 size={compact ? 18 : 17} aria-hidden="true" />
        )}
        {!compact && "Share POAP"}
      </button>

      {isOpen && (
        <div className="event-share-menu" id={menuId} role="menu">
          <span className="event-share-menu-label">SHARE POAP</span>
          <button
            type="button"
            role="menuitem"
            onClick={shareOnFarcaster}
            disabled={sharingTarget !== null}
          >
            <FarcasterIcon />
            <span>
              <strong>Farcaster</strong>
              <small>Open the cast composer</small>
            </span>
            <b>{sharingTarget === "farcaster" ? "Opening…" : "Share →"}</b>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={shareOnX}
            disabled={sharingTarget !== null}
          >
            <XIcon />
            <span>
              <strong>X</strong>
              <small>Post with the claim link</small>
            </span>
            <b>{sharingTarget === "x" ? "Opening…" : "Share →"}</b>
          </button>
          <button type="button" role="menuitem" onClick={copyClaimLink}>
            {copied ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
            <span>
              <strong>{copied ? "Link copied" : "Copy link"}</strong>
              <small>Use it anywhere</small>
            </span>
            <b>{copied ? "Done" : "Copy"}</b>
          </button>
        </div>
      )}
    </div>
  );
}
