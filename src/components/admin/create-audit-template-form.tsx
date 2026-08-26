"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createAuditTemplateAction } from "@/lib/actions/audits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateAuditTemplateForm({ organisationId }: { organisationId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createAuditTemplateAction(organisationId, formData);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        + New template
      </Button>
    );
  }

  return (
    <form action={submit} className="w-full max-w-md space-y-2 rounded-lg border border-border bg-card p-3">
      <Input name="name" placeholder="Template name" required autoFocus />
      <Textarea name="description" placeholder="Description (optional)" rows={2} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create template"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
