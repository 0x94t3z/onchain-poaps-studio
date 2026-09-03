"use client";

import { useEffect } from "react";

const STORAGE_KEY = "onchain-poaps-chunk-reload";

function isChunkLoadFailure(reason: unknown) {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "";

  return (
    /ChunkLoadError|Loading chunk .* failed|failed to fetch dynamically imported module/i.test(
      message,
    ) && message.includes("/_next/static/chunks/")
  );
}

export function ChunkErrorRecovery() {
  useEffect(() => {
    const reloadOnce = () => {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
      sessionStorage.setItem(STORAGE_KEY, "1");
      window.location.reload();
    };

    const clearReloadFlag = () => {
      sessionStorage.removeItem(STORAGE_KEY);
    };

    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadFailure(event.error) || isChunkLoadFailure(event.message)) {
        event.preventDefault();
        reloadOnce();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadFailure(event.reason)) {
        event.preventDefault();
        reloadOnce();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("load", clearReloadFlag, { once: true });

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("load", clearReloadFlag);
    };
  }, []);

  return null;
}
