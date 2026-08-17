import Link from "next/link";
import { IncidentPriorityBadge, IncidentStatusBadge } from "@/components/status-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
            return (
              <TableRow key={incident.id} className="row-interactive">
                <TableCell className="font-mono text-xs">
                  <Link href={`/incidents/${incident.id}`} className="block font-medium text-foreground">
                    {incident.reference.split("-INC-").pop()}
                  </Link>
                </TableCell>
                <TableCell>
                  {priority ? (
                    <IncidentPriorityBadge code={priority.code} name={priority.name} colorToken={priority.color_token} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-foreground">{categoryByCode.get(incident.category_code) ?? incident.category_code}</TableCell>
                <TableCell className="text-muted-foreground">{incident.operational_locations?.name ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate text-foreground">{incident.summary}</TableCell>
                <TableCell className="data-value">{formatAge(incident.created_at)}</TableCell>
                <TableCell className="text-muted-foreground">{personName(incident.controller)}</TableCell>
                <TableCell className="text-muted-foreground">{personName(incident.owner)}</TableCell>
                <TableCell>
                  <IncidentStatusBadge status={incident.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
