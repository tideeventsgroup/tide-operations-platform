"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IncidentPriorityBadge, IncidentStatusBadge } from "@/components/status-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { listIncidentCategories, listIncidentPriorities, listIncidents } from "@/lib/domain/incident-service";

type Incident = Awaited<ReturnType<typeof listIncidents>>[number];
type Category = Awaited<ReturnType<typeof listIncidentCategories>>[number];
type Priority = Awaited<ReturnType<typeof listIncidentPriorities>>[number];
type Density = "comfortable" | "compact";

function formatAge(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "—";
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
  const [density, setDensity] = useState<Density>("compact");
  const categoryByCode = new Map(categories.map((c) => [c.code, c.name]));
  const priorityByCode = new Map(priorities.map((p) => [p.code, p]));
  const cellPad = density === "compact" ? "py-1" : "py-2.5";

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
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
          {(["comfortable", "compact"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDensity(option)}
              className={cn(
                "rounded px-2 py-1 font-medium capitalize transition-colors",
                density === option ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Controller</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((incident) => {
              const priority = incident.priority_code ? priorityByCode.get(incident.priority_code) : undefined;
              const isOpen = incident.status !== "closed" && incident.status !== "resolved";
              const isUrgent = isOpen && (incident.priority_code === "P1" || incident.priority_code === "P2");
              return (
                <TableRow
                  key={incident.id}
                  className={cn(
                    "row-interactive border-l-4",
                    isUrgent
                      ? incident.priority_code === "P1"
                        ? "border-l-destructive"
                        : "border-l-warning"
                      : "border-l-transparent",
                  )}
                >
                  <TableCell className={cn("font-mono text-xs", cellPad)}>
                    <Link href={`/incidents/${incident.id}`} className="block font-medium text-foreground">
                      {incident.reference.split("-INC-").pop()}
                    </Link>
                  </TableCell>
                  <TableCell className={cellPad}>
                    {priority ? (
                      <IncidentPriorityBadge code={priority.code} name={priority.name} colorToken={priority.color_token} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-foreground", cellPad)}>
                    {categoryByCode.get(incident.category_code) ?? incident.category_code}
                  </TableCell>
                  <TableCell className={cn("text-muted-foreground", cellPad)}>
                    {incident.operational_locations?.name ?? "—"}
                  </TableCell>
                  <TableCell className={cn("max-w-xs truncate text-foreground", cellPad)}>{incident.summary}</TableCell>
                  <TableCell className={cn("data-value", cellPad)}>{formatAge(incident.created_at)}</TableCell>
                  <TableCell className={cn("text-muted-foreground", cellPad)}>{personName(incident.controller)}</TableCell>
                  <TableCell className={cn("text-muted-foreground", cellPad)}>{personName(incident.owner)}</TableCell>
                  <TableCell className={cellPad}>
                    <IncidentStatusBadge status={incident.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
