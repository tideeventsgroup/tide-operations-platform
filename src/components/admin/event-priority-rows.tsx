"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createEventPriority, deleteEventPriority, updateEventPriority } from "@/lib/actions/admin-reference-data";
import { DeleteConfigButton } from "@/components/admin/delete-config-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventPriorityBadge } from "@/components/status-badges";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";
import type { Tables } from "@/lib/supabase/types";

type EventPriority = Tables<"event_priorities">;

const COLOR_TOKENS = ["destructive", "warning", "info", "success", "muted"];

function PriorityFields({ priority }: { priority?: EventPriority }) {
  return (
    <>
      <Input name="name" defaultValue={priority?.name} placeholder="Name" className="w-32" required />
      <Input name="description" defaultValue={priority?.description} placeholder="Description" className="flex-1 min-w-40" required />
      <Input name="rank" type="number" defaultValue={priority?.rank ?? 1} placeholder="Rank" className="w-16" required />
      <select
        name="colorToken"
        defaultValue={priority?.color_token ?? "destructive"}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
      >
        {COLOR_TOKENS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <Input
        name="targetAckMinutes"
        type="number"
        defaultValue={priority?.target_ack_minutes ?? ""}
        placeholder="Ack min"
        className="w-20"
      />
      <Input
        name="targetResolveMinutes"
        type="number"
        defaultValue={priority?.target_resolve_minutes ?? ""}
        placeholder="Resolve min"
        className="w-24"
      />
    </>
  );
}

export function EventPriorityRows({ organisationId, priorities }: { organisationId: string; priorities: EventPriority[] }) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function submitEdit(formData: FormData) {
    startTransition(async () => {
      const result = await updateEventPriority(organisationId, formData);
      if (result.error) toast.error(result.error);
      else setEditingCode(null);
    });
  }

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createEventPriority(organisationId, formData);
      if (result.error) toast.error(result.error);
      else setAdding(false);
    });
  }

  return (
    <DataTable>
      <DataTableHead>
        <DataTableHeadCell>Code</DataTableHeadCell>
        <DataTableHeadCell>Preview</DataTableHeadCell>
        <DataTableHeadCell>Description</DataTableHeadCell>
        <DataTableHeadCell>Rank</DataTableHeadCell>
        <DataTableHeadCell>Targets</DataTableHeadCell>
        <DataTableHeadCell>{null}</DataTableHeadCell>
      </DataTableHead>
      <DataTableBody>
        {priorities.map((p) =>
          editingCode === p.code ? (
            <DataTableRow key={p.code}>
              <td colSpan={6} className="px-4 py-3">
                <form action={submitEdit} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="code" value={p.code} />
                  <PriorityFields priority={p} />
                  <Button type="submit" size="sm" disabled={pending}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setEditingCode(null)}>
                    Cancel
                  </Button>
                </form>
              </td>
            </DataTableRow>
          ) : (
            <DataTableRow key={p.code}>
              <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{p.code}</td>
              <td className="px-4 py-3 align-top">
                <EventPriorityBadge code={p.code} colorToken={p.color_token ?? undefined} />
              </td>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">{p.description}</td>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">{p.rank}</td>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                {p.target_ack_minutes ? `Ack ${p.target_ack_minutes}m` : null}
                {p.target_ack_minutes && p.target_resolve_minutes ? " · " : null}
                {p.target_resolve_minutes ? `Resolve ${p.target_resolve_minutes}m` : null}
                {!p.target_ack_minutes && !p.target_resolve_minutes ? "—" : null}
              </td>
              <td className="px-4 py-3 align-top text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingCode(p.code)}>
                    Edit
                  </Button>
                  <DeleteConfigButton label={p.name} onDelete={() => deleteEventPriority(organisationId, p.code)} />
                </div>
              </td>
            </DataTableRow>
          ),
        )}
        {adding ? (
          <DataTableRow>
            <td colSpan={6} className="px-4 py-3">
              <form action={submitCreate} className="flex flex-wrap items-center gap-2">
                <Input name="code" placeholder="P1" className="w-16" required autoFocus />
                <PriorityFields />
                <Button type="submit" size="sm" disabled={pending}>
                  Add
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </form>
            </td>
          </DataTableRow>
        ) : (
          <DataTableRow>
            <td colSpan={6} className="px-4 py-3">
              <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
                + Add priority
              </Button>
            </td>
          </DataTableRow>
        )}
      </DataTableBody>
    </DataTable>
  );
}
