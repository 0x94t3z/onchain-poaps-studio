"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Settings2, Share2, X } from "lucide-react";

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
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect width="24" height="24" rx="4" fill="#050505" />
      <g transform="translate(3.5 3.5) scale(.7083)">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.499 11.24h-6.657l-5.214-6.817-5.964 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"
          fill="white"
        />
      </g>
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
  const menuLabelId = `${menuId}-label`;
  const shareActionsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    function placeMenu() {
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const mobile = viewportWidth <= 850;
      const edge = 12;
      const bottomGuard = mobile ? 76 : edge;
      const topEdge = viewportTop + edge;
      const bottomEdge = viewportTop + viewportHeight - bottomGuard;
      const triggerRect = trigger!.getBoundingClientRect();
      const width = Math.min(mobile ? 340 : 360, viewportWidth - edge * 2);
      const availableHeight = Math.max(240, bottomEdge - topEdge);
      const height = Math.min(menu!.scrollHeight, availableHeight);
      const roomBelow = bottomEdge - triggerRect.bottom - 8;
      const roomAbove = triggerRect.top - topEdge - 8;
      const placeAbove = roomBelow < height && roomAbove > roomBelow;
      const top = placeAbove
        ? Math.max(topEdge, triggerRect.top - height - 8)
        : Math.min(triggerRect.bottom + 8, bottomEdge - height);
      const preferredLeft = mobile
        ? triggerRect.right - width
        : triggerRect.left;
      const left = Math.min(
        Math.max(preferredLeft, viewportLeft + edge),
        viewportLeft + viewportWidth - width - edge,
      );

      menu!.style.setProperty("--share-top", `${top}px`);
      menu!.style.setProperty("--share-left", `${left}px`);
      menu!.style.setProperty("--share-width", `${width}px`);
      menu!.style.setProperty("--share-max-height", `${availableHeight}px`);
      menu!.dataset.placed = "true";
    }

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    window.visualViewport?.addEventListener("resize", placeMenu);
    window.visualViewport?.addEventListener("scroll", placeMenu);

    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
      window.visualViewport?.removeEventListener("resize", placeMenu);
      window.visualViewport?.removeEventListener("scroll", placeMenu);
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
        ref={triggerRef}
        type="button"
        className={compact ? "event-share-icon" : "button"}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Share ${eventName || `POAP #${eventId}`}`}
        aria-haspopup="dialog"
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
        <div
          ref={menuRef}
          className="event-share-menu"
          id={menuId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={menuLabelId}
        >
          <div className="event-share-menu-heading">
            <span className="event-share-menu-label" id={menuLabelId}>
              SHARE POAP
            </span>
            <button
              type="button"
              className="event-share-menu-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close share options"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={shareOnFarcaster}
            disabled={sharingTarget !== null}
          >
            <FarcasterIcon />
            <span>
              <strong>Farcaster</strong>
              <small>Click to cast</small>
            </span>
            <b>{sharingTarget === "farcaster" ? "Opening…" : "Share →"}</b>
          </button>
          <button
            type="button"
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
          <button type="button" onClick={copyClaimLink}>
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
