"use client";

import { useEffect, useState } from "react";
import { priorityColor, isPriorityCode } from "@/lib/priority-colors";

function formatElapsed(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// The mockup's "OPEN · 10:12 ELAPSED" pill — ticks live while open, freezes
// at the closing timestamp once resolved/closed. Colour reuses the
// reserved priority ramp (never decorative elsewhere on this pill).
export function EventStatusElapsedPill({
  status,
  priorityCode,
  createdAt,
  endedAt,
}: {
  status: string;
  priorityCode: string | null;
  createdAt: string;
  endedAt: string | null;
}) {
  const isOpen = status !== "resolved" && status !== "closed";
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    function tick() {
      const endMs = endedAt ? new Date(endedAt).getTime() : Date.now();
      setSeconds(Math.max(0, Math.floor((endMs - new Date(createdAt).getTime()) / 1000)));
    }
    tick();
    if (endedAt) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt, endedAt]);

  const color = isOpen && isPriorityCode(priorityCode) ? priorityColor(priorityCode) : isOpen ? "var(--muted-foreground)" : "var(--priority-resolved)";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-[10.5px] font-medium tracking-[0.05em] uppercase"
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${color} 35%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {isOpen ? `Open · ${formatElapsed(seconds)} elapsed` : status}
    </span>
  );
}
