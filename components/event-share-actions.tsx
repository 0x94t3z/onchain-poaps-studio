"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

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
}: {
  eventId: string;
  eventName: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function copyClaimLink() {
    await copyText(eventUrl(eventId));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareClaimLink() {
    const url = eventUrl(eventId);
    setSharing(true);

    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      if (await sdk.isInMiniApp()) {
        await sdk.actions.composeCast({
          text: `View ${eventName || "this POAP"} on Onchain POAPs.`,
          embeds: [url],
        });
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: eventName || "Onchain POAP",
          text: `View ${eventName || "this POAP"} on Onchain POAPs.`,
          url,
        });
        return;
      }

      await copyClaimLink();
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      await copyClaimLink();
    } finally {
      setSharing(false);
    }
  }

  return (
    <div
      className={`event-share-actions${compact ? " event-share-actions-compact" : ""}`}
    >
      <button
        type="button"
        className={compact ? "event-share-icon" : "button"}
        onClick={shareClaimLink}
        disabled={sharing}
        aria-label={`Share ${eventName || `POAP #${eventId}`}`}
        title="Share POAP"
      >
        {copied && compact ? (
          <Check size={18} aria-hidden="true" />
        ) : (
          <Share2 size={compact ? 18 : 17} aria-hidden="true" />
        )}
        {!compact && (sharing ? "Opening share…" : "Share POAP")}
      </button>
      {!compact && (
        <button
          type="button"
          className="button secondary"
          onClick={copyClaimLink}
        >
          <Copy size={17} aria-hidden="true" />
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
      )}
    </div>
  );
}
