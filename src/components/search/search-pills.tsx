import Link from "next/link";
import { Building2, Car, ClipboardCheck, ClipboardList, FileSearch, Siren, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchEntityType, SearchScopes } from "@/lib/domain/search-service";

const PILLS: { key: SearchEntityType | "all"; label: string; icon: React.ComponentType<{ className?: string }> | null }[] = [
  { key: "all", label: "All", icon: null },
  { key: "operations", label: "Operations", icon: ClipboardList },
  { key: "events", label: "Events", icon: Siren },
  { key: "clients", label: "Clients", icon: Building2 },
  { key: "people", label: "People", icon: User },
  { key: "vehicles", label: "Vehicles", icon: Car },
  { key: "investigations", label: "Investigations", icon: FileSearch },
  { key: "audits", label: "Audits", icon: ClipboardCheck },
];

function formatCount(n: number) {
  return n > 999 ? "999+" : String(n);
}

export function SearchPills({
  active,
  query,
  scopes,
  counts,
}: {
  active: SearchEntityType | "all";
  query: string;
  scopes: SearchScopes;
  counts: Record<SearchEntityType, number>;
}) {
  const visible = PILLS.filter((p) => p.key === "all" || scopes[p.key]);

  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
      {visible.map((pill) => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (pill.key !== "all") params.set("type", pill.key);
        const search = params.toString();
        const href = `/search${search ? `?${search}` : ""}`;
        const isActive = pill.key === active;
        const Icon = pill.icon;
        return (
          <Link
            key={pill.key}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-4" /> : null}
            {pill.label}
            {pill.key !== "all" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {formatCount(counts[pill.key])}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
