"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addAuditTemplateQuestionAction, deleteAuditTemplateQuestionAction, updateAuditTemplateQuestionAction } from "@/lib/actions/audits";
import { DeleteConfigButton } from "@/components/admin/delete-config-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";
import type { Tables } from "@/lib/supabase/types";

type Question = Tables<"audit_template_questions">;

export function AuditQuestionRows({ templateId, questions }: { templateId: string; questions: Question[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function submitEdit(id: string, formData: FormData) {
    startTransition(async () => {
      const result = await updateAuditTemplateQuestionAction(templateId, id, formData);
      if (result.error) toast.error(result.error);
      else setEditingId(null);
    });
  }

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      const result = await addAuditTemplateQuestionAction(templateId, formData);
      if (result.error) toast.error(result.error);
      else setAdding(false);
    });
  }

  return (
    <DataTable>
      <DataTableHead>
        <DataTableHeadCell>Section</DataTableHeadCell>
        <DataTableHeadCell>Question</DataTableHeadCell>
        <DataTableHeadCell>Sort</DataTableHeadCell>
        <DataTableHeadCell>Weight</DataTableHeadCell>
        <DataTableHeadCell>{null}</DataTableHeadCell>
      </DataTableHead>
      <DataTableBody>
        {questions.map((q) =>
          editingId === q.id ? (
            <DataTableRow key={q.id}>
              <td colSpan={5} className="px-4 py-3">
                <form action={(fd) => submitEdit(q.id, fd)} className="flex flex-wrap items-center gap-2">
                  <Input name="section" defaultValue={q.section ?? ""} placeholder="Section" className="w-32" />
                  <Input name="questionText" defaultValue={q.question_text} placeholder="Question" className="flex-1 min-w-60" required />
                  <Input name="sortOrder" type="number" defaultValue={q.sort_order} className="w-16" />
                  <Input name="weight" type="number" defaultValue={q.weight} className="w-16" />
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
            <DataTableRow key={q.id}>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">{q.section ?? "—"}</td>
              <td className="px-4 py-3 align-top font-medium text-foreground">{q.question_text}</td>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">{q.sort_order}</td>
              <td className="px-4 py-3 align-top text-sm text-muted-foreground">{q.weight}</td>
              <td className="px-4 py-3 align-top text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(q.id)}>
                    Edit
                  </Button>
                  <DeleteConfigButton
                    label={q.question_text}
                    onDelete={() => deleteAuditTemplateQuestionAction(templateId, q.id)}
                  />
                </div>
              </td>
            </DataTableRow>
          ),
        )}
        {adding ? (
          <DataTableRow>
            <td colSpan={5} className="px-4 py-3">
              <form action={submitCreate} className="flex flex-wrap items-center gap-2">
                <Input name="section" placeholder="Section" className="w-32" />
                <Input name="questionText" placeholder="Question" className="flex-1 min-w-60" required autoFocus />
                <Input name="sortOrder" type="number" defaultValue={questions.length} className="w-16" />
                <Input name="weight" type="number" defaultValue={1} className="w-16" />
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
                + Add question
              </Button>
            </td>
          </DataTableRow>
        )}
      </DataTableBody>
    </DataTable>
  );
}
