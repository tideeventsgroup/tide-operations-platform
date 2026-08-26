"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createInvestigationAction } from "@/lib/actions/investigations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function NewInvestigationForm({ organisationId, initialOpen = false }: { organisationId: string; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createInvestigationAction(organisationId, title.trim(), summary.trim() || undefined);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        New investigation
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2 rounded-lg border border-border bg-card p-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Investigation title" disabled={pending} autoFocus />
      <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary (optional)" rows={2} disabled={pending} />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending || !title.trim()} onClick={submit}>
          {pending ? "Opening…" : "Open investigation"}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
