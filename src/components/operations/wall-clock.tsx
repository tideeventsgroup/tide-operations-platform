"use client";

import { useEffect, useState } from "react";

// Ticks every second on the client only — the server-rendered time would
// otherwise go stale the instant the page loads and never move again
// between the 30s AutoRefresh cycles.
export function WallClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-[30px] leading-none font-semibold tracking-tight text-white tabular-nums">
      {now ? now.toLocaleTimeString("en-GB", { hour12: false }) : "--:--:--"}
    </span>
  );
}
