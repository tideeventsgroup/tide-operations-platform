"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { EventPriorityBadge, EventStatusBadge } from "@/components/status-badges";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";
import { splitEventReference } from "@/lib/format-reference";
import type { listEventCategories, listEventPriorities, listEvents } from "@/lib/domain/event-service";

type Incident = Awaited<ReturnType<typeof listEvents>>[number];
type Category = Awaited<ReturnType<typeof listEventCategories>>[number];
type Priority = Awaited<ReturnType<typeof listEventPriorities>>[number];

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

export function EventBoard({
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
    <DataTable>
      <DataTableHead>
        <DataTableHeadCell>Reference</DataTableHeadCell>
        <DataTableHeadCell>Event</DataTableHeadCell>
        <DataTableHeadCell>Priority</DataTableHeadCell>
        <DataTableHeadCell>Status</DataTableHeadCell>
        <DataTableHeadCell>Controller / Owner</DataTableHeadCell>
        <DataTableHeadCell>Age</DataTableHeadCell>
      </DataTableHead>
      <DataTableBody>
        {sorted.map((incident) => {
          const priority = incident.priority_code ? priorityByCode.get(incident.priority_code) : undefined;
          const isOpen = incident.status !== "closed" && incident.status !== "resolved";
          const isUrgent = isOpen && (incident.priority_code === "P1" || incident.priority_code === "P2");
          return (
            <DataTableRow
              key={incident.id}
              className={cn("border-l-4", isUrgent ? (incident.priority_code === "P1" ? "border-l-destructive" : "border-l-warning") : "border-l-transparent")}
            >
              <td className="px-4 py-3 align-top">
                <Link href={`/events/${incident.id}`} className="font-medium text-primary hover:underline">
                  {(() => {
                    const { prefix, number } = splitEventReference(incident.reference);
                    return `${prefix}-${number}`;
                  })()}
                </Link>
              </td>
              <DataTableCell
                primary={incident.summary}
                secondary={[categoryByCode.get(incident.category_code) ?? incident.category_code, incident.operational_locations?.name]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <td className="px-4 py-3 align-top">
                {priority ? <EventPriorityBadge code={priority.code} name={priority.name} colorToken={priority.color_token} /> : "—"}
              </td>
              <td className="px-4 py-3 align-top">
                <EventStatusBadge status={incident.status} />
              </td>
              <DataTableCell primary={personName(incident.controller)} secondary={`Owner: ${personName(incident.owner)}`} />
              <DataTableCell primary={formatAge(incident.created_at)} />
            </DataTableRow>
          );
        })}
      </DataTableBody>
    </DataTable>
  );
}
