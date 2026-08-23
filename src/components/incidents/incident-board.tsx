"use client";

import { cn } from "@/lib/utils";
import { IncidentPriorityBadge, IncidentStatusBadge } from "@/components/status-badges";
import { EntityCard } from "@/components/ui/entity-card";
import type { listIncidentCategories, listIncidentPriorities, listIncidents } from "@/lib/domain/incident-service";

type Incident = Awaited<ReturnType<typeof listIncidents>>[number];
type Category = Awaited<ReturnType<typeof listIncidentCategories>>[number];
type Priority = Awaited<ReturnType<typeof listIncidentPriorities>>[number];

function formatAge(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "Unassigned";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

const PRIORITY_RANK: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };

export function IncidentBoard({
  incidents,
  categories,
  priorities,
}: {
  incidents: Incident[];
  categories: Category[];
  priorities: Priority[];
}) {
  const categoryByCode = new Map(categories.map((c) => [c.code, c.name]));
  const priorityByCode = new Map(priorities.map((p) => [p.code, p]));

  const sorted = [...incidents].sort((a, b) => {
    const openA = a.status !== "closed" && a.status !== "resolved" ? 0 : 1;
    const openB = b.status !== "closed" && b.status !== "resolved" ? 0 : 1;
    if (openA !== openB) return openA - openB;
    const rankA = a.priority_code ? (PRIORITY_RANK[a.priority_code] ?? 9) : 9;
    const rankB = b.priority_code ? (PRIORITY_RANK[b.priority_code] ?? 9) : 9;
    if (rankA !== rankB) return rankA - rankB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-3">
      {sorted.map((incident) => {
        const priority = incident.priority_code ? priorityByCode.get(incident.priority_code) : undefined;
        const isOpen = incident.status !== "closed" && incident.status !== "resolved";
        const isUrgent = isOpen && (incident.priority_code === "P1" || incident.priority_code === "P2");
        return (
          <EntityCard
            key={incident.id}
            href={`/incidents/${incident.id}`}
            title={incident.summary}
            reference={incident.reference.split("-INC-").pop()}
            meta={formatAge(incident.created_at)}
            value={<IncidentStatusBadge status={incident.status} />}
            subtitle={[categoryByCode.get(incident.category_code) ?? incident.category_code, incident.operational_locations?.name]
              .filter(Boolean)
              .join(" · ")}
            className={cn(
              "border-l-4",
              isUrgent ? (incident.priority_code === "P1" ? "border-l-destructive" : "border-l-warning") : "border-l-border",
            )}
          >
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
              {priority ? <IncidentPriorityBadge code={priority.code} name={priority.name} colorToken={priority.color_token} /> : null}
              <span>Controller: {personName(incident.controller)}</span>
              <span>Owner: {personName(incident.owner)}</span>
            </div>
          </EntityCard>
        );
      })}
    </div>
  );
}
