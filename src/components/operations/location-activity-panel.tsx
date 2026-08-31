"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type LocationActivity = { name: string; count: number };

// Bars (rank by count) or a grid (relative scan of "where") — the wall
// display's own "site map" idea, adapted honestly: no location in this
// schema carries real coordinates, so this is a sized-tile layout rather
// than a fabricated pixel-positioned floor plan.
export function LocationActivityPanel({ locations }: { locations: LocationActivity[] }) {
  const [view, setView] = useState<"bars" | "grid">("bars");
  const maxCount = Math.max(1, ...locations.map((l) => l.count));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.12em] text-white/45 uppercase">Open events by location</span>
        <div className="flex rounded-full border border-white/15 p-0.5">
          {(["bars", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.05em] uppercase",
                view === v ? "bg-white/15 text-white" : "text-white/40",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {locations.length === 0 ? (
        <p className="mb-5 text-sm text-white/40">No open events tied to a specific location.</p>
      ) : view === "bars" ? (
        <div className="mb-5 flex flex-col gap-2">
          {locations.map((loc) => (
            <div key={loc.name} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-[12.5px] text-white/75">{loc.name}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-white/[.06]">
                <div className="h-full" style={{ width: `${(loc.count / maxCount) * 100}%`, background: "oklch(0.55 0.11 235)" }} />
              </div>
              <span className="w-6 text-right font-mono text-xs font-medium text-white">{loc.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {locations.map((loc) => (
            <div
              key={loc.name}
              className="rounded-md border p-3"
              style={{
                background: "#171d20",
                borderColor: loc.count === maxCount ? "oklch(0.68 0.16 62)" : "rgba(255,255,255,.1)",
              }}
            >
              <div className="mb-1 truncate font-mono text-[10px] tracking-[0.06em] text-white/50 uppercase">{loc.name}</div>
              <div className="font-mono text-xl font-semibold text-white">{loc.count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
