"use client";

import { DataTableRow } from "@/components/ui/data-table";
import type { listAuditLog } from "@/lib/domain/admin-service";

type Entry = Awaited<ReturnType<typeof listAuditLog>>["entries"][number];

function personName(p: { first_name: string | null; surname: string | null; email: string } | null | undefined) {
  if (!p) return "System";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function AuditLogRow({ entry }: { entry: Entry }) {
  const hasState = entry.before_state || entry.after_state;
  return (
    <DataTableRow>
      <td className="px-4 py-3 align-top text-sm text-muted-foreground">{formatTime(entry.created_at)}</td>
      <td className="px-4 py-3 align-top">
        <div className="font-medium text-foreground">{personName(entry.profiles)}</div>
      </td>
      <td className="px-4 py-3 align-top text-sm">
        <span className="font-medium text-foreground">{entry.entity_type}</span>
        <span className="text-muted-foreground"> · {entry.action}</span>
      </td>
      <td className="px-4 py-3 align-top text-sm text-muted-foreground">{entry.reason ?? "—"}</td>
      <td className="px-4 py-3 align-top">
        {hasState ? (
          <details>
            <summary className="cursor-pointer text-sm text-primary hover:underline">Details</summary>
            <pre className="mt-2 max-w-md overflow-x-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
              {JSON.stringify({ before: entry.before_state, after: entry.after_state }, null, 2)}
            </pre>
          </details>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
    </DataTableRow>
  );
}
