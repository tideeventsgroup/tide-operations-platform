import { cn } from "@/lib/utils";

// Matched against Auror's actual stat-tile pattern (their "Footage
// requests" and dashboard screens): one bordered card holding every tile
// in the group, not a separate bordered box per number.
export function StatTileGroup({ children, columns = 4 }: { children: React.ReactNode; columns?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border border-border bg-card p-5",
        columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

export function StatTile({ label, value, caption }: { label: string; value: React.ReactNode; caption?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{value}</div>
      {caption ? <div className="mt-1 text-xs text-muted-foreground">{caption}</div> : null}
    </div>
  );
}
