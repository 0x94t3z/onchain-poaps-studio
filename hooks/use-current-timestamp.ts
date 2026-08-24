"use client";

import { useEffect, useState } from "react";

export function useCurrentTimestamp(interval = 30_000) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setNow(Math.floor(Date.now() / 1000));
    update();
    const timer = window.setInterval(
      update,
      interval,
    );
    return () => window.clearInterval(timer);
  }, [interval]);

  return now;
}
