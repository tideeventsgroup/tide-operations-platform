"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createControlRole, deleteControlRole, updateControlRole } from "@/lib/actions/admin-reference-data";
import { DeleteConfigButton } from "@/components/admin/delete-config-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";
import type { Tables } from "@/lib/supabase/types";

type ControlRole = Tables<"operation_control_roles">;

export function ControlRoleRows({ organisationId, controlRoles }: { organisationId: string; controlRoles: ControlRole[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function submitEdit(id: string, formData: FormData) {
    startTransition(async () => {
      const result = await updateControlRole(id, formData);
      if (result.error) toast.error(result.error);
      else setEditingId(null);
    });
  }

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createControlRole(organisationId, formData);
      if (result.error) toast.error(result.error);
      else setAdding(false);
    });
  }

  return (
    <DataTable>
      <DataTableHead>
        <DataTableHeadCell>Code</DataTableHeadCell>
        <DataTableHeadCell>Name</DataTableHeadCell>
        <DataTableHeadCell>Sort</DataTableHeadCell>
        <DataTableHeadCell>{null}</DataTableHeadCell>
      </DataTableHead>
      <DataTableBody>
        {controlRoles.map((role) =>
          editingId === role.id ? (
            <DataTableRow key={role.id}>
              <td colSpan={4} className="px-4 py-3">
                <form action={(fd) => submitEdit(role.id, fd)} className="flex flex-wrap items-center gap-2">
                  <Input name="name" defaultValue={role.name} placeholder="Name" className="w-48" required />
                  <Input name="sortOrder" type="number" defaultValue={role.sort_order} className="w-20" />
                  <Button type="submit" size="sm" disabled={pending}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </form>
              </td>
            </DataTableRow>
          ) : (
            <DataTableRow key={role.id}>
              <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{role.code}</td>
              <td className="px-4 py-3 align-top font-medium text-foreground">{role.name}</td>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">{role.sort_order}</td>
              <td className="px-4 py-3 align-top text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(role.id)}>
                    Edit
                  </Button>
                  <DeleteConfigButton label={role.name} onDelete={() => deleteControlRole(role.id)} />
                </div>
              </td>
            </DataTableRow>
          ),
        )}
        {adding ? (
          <DataTableRow>
            <td colSpan={4} className="px-4 py-3">
              <form action={submitCreate} className="flex flex-wrap items-center gap-2">
                <Input name="code" placeholder="code_like_this" className="w-32" required autoFocus />
                <Input name="name" placeholder="Name" className="w-48" required />
                <Input name="sortOrder" type="number" defaultValue={0} className="w-20" />
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
            <td colSpan={4} className="px-4 py-3">
              <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
                + Add control role
              </Button>
            </td>
          </DataTableRow>
        )}
      </DataTableBody>
    </DataTable>
  );
}
