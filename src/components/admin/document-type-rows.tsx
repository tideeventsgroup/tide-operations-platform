"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createDocumentType, deleteDocumentType, updateDocumentType } from "@/lib/actions/admin-reference-data";
import { DeleteConfigButton } from "@/components/admin/delete-config-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";
import type { Tables } from "@/lib/supabase/types";

type DocumentType = Tables<"document_types">;

export function DocumentTypeRows({ organisationId, documentTypes }: { organisationId: string; documentTypes: DocumentType[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function submitEdit(id: string, formData: FormData) {
    startTransition(async () => {
      const result = await updateDocumentType(id, formData);
      if (result.error) toast.error(result.error);
      else setEditingId(null);
    });
  }

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createDocumentType(organisationId, formData);
      if (result.error) toast.error(result.error);
      else setAdding(false);
    });
  }

  return (
    <DataTable>
      <DataTableHead>
        <DataTableHeadCell>Code</DataTableHeadCell>
        <DataTableHeadCell>Name</DataTableHeadCell>
        <DataTableHeadCell>Description</DataTableHeadCell>
        <DataTableHeadCell>Sort</DataTableHeadCell>
        <DataTableHeadCell>{null}</DataTableHeadCell>
      </DataTableHead>
      <DataTableBody>
        {documentTypes.map((dt) =>
          editingId === dt.id ? (
            <DataTableRow key={dt.id}>
              <td colSpan={5} className="px-4 py-3">
                <form
                  action={(fd) => submitEdit(dt.id, fd)}
                  className="flex flex-wrap items-center gap-2"
                >
                  <Input name="name" defaultValue={dt.name} placeholder="Name" className="w-40" required />
                  <Input name="description" defaultValue={dt.description ?? ""} placeholder="Description" className="flex-1 min-w-40" />
                  <Input name="sortOrder" type="number" defaultValue={dt.sort_order} className="w-20" />
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
            <DataTableRow key={dt.id}>
              <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{dt.code}</td>
              <td className="px-4 py-3 align-top font-medium text-foreground">{dt.name}</td>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">{dt.description ?? "—"}</td>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">{dt.sort_order}</td>
              <td className="px-4 py-3 align-top text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(dt.id)}>
                    Edit
                  </Button>
                  <DeleteConfigButton label={dt.name} onDelete={() => deleteDocumentType(dt.id)} />
                </div>
              </td>
            </DataTableRow>
          ),
        )}
        {adding ? (
          <DataTableRow>
            <td colSpan={5} className="px-4 py-3">
              <form action={submitCreate} className="flex flex-wrap items-center gap-2">
                <Input name="code" placeholder="code_like_this" className="w-32" required autoFocus />
                <Input name="name" placeholder="Name" className="w-40" required />
                <Input name="description" placeholder="Description" className="flex-1 min-w-40" />
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
            <td colSpan={5} className="px-4 py-3">
              <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
                + Add document type
              </Button>
            </td>
          </DataTableRow>
        )}
      </DataTableBody>
    </DataTable>
  );
}
