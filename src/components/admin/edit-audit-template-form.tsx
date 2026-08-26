"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAuditTemplateAction, updateAuditTemplateAction } from "@/lib/actions/audits";
import { AuditTemplateActiveToggle } from "@/components/admin/audit-template-active-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/types";

export function EditAuditTemplateForm({ template }: { template: Tables<"audit_templates"> }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateAuditTemplateAction(template.id, formData);
      if (result.error) toast.error(result.error);
      else setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteAuditTemplateAction(template.id);
      if (result.error) toast.error(result.error);
    });
  }

  if (editing) {
    return (
      <form action={submit} className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Input name="name" defaultValue={template.name} placeholder="Name" required autoFocus />
        <Textarea name="description" defaultValue={template.description ?? ""} placeholder="Description" rows={2} />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
        Edit
      </Button>
      <AuditTemplateActiveToggle templateId={template.id} isActive={template.is_active} />
      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={handleDelete} className="text-destructive">
        Delete
      </Button>
    </div>
  );
}
