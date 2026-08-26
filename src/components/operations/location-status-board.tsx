import Link from "next/link";
import { LocationStatusBadge } from "@/components/status-badges";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

// A structured spatial status grid, not a literal floorplan — there's no
// site-plan/coordinate asset system in this app, so "map" here means
// "every location, its current status, and what's open there," grouped
// by the Site → Zone → Area → Location hierarchy rather than pinned to
// an image.
export function LocationStatusBoard({
  operationId,
  locations,
  openIncidentCountByLocation,
}: {
  operationId: string;
  locations: Tables<"operational_locations">[];
  openIncidentCountByLocation: Map<string, number>;
}) {
  if (locations.length === 0) {
    return <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">No locations defined for this event</p>;
  }

  const byParent = new Map<string | null, Tables<"operational_locations">[]>();
  for (const loc of locations) {
    const key = loc.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(loc);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.name.localeCompare(b.name));

  function renderLevel(parentId: string | null, depth: number): React.ReactNode {
    const children = byParent.get(parentId);
    if (!children) return null;
    return (
      <div className={depth > 0 ? "ml-4 space-y-2 border-l border-border pl-4" : "space-y-2"}>
        {children.map((loc) => {
          const openCount = openIncidentCountByLocation.get(loc.id) ?? 0;
          return (
            <div key={loc.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="section-label !text-[10px]">{loc.type}</span>
                  <span className="font-medium text-foreground">{loc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {openCount > 0 ? (
                    <Link href={`/operations/${operationId}/events`} className={cn("text-xs font-semibold hover:underline", "text-destructive")}>
                      {openCount} open
                    </Link>
                  ) : null}
                  <LocationStatusBadge status={loc.status} />
                </div>
              </div>
              {renderLevel(loc.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  }

  return renderLevel(null, 0);
}
