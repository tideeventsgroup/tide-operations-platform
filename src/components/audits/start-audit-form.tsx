"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { startAuditSubmissionAction } from "@/lib/actions/audits";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/types";

export function StartAuditForm({ templates }: { templates: Tables<"audit_templates">[] }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function start() {
    if (!templateId) return;
    startTransition(async () => {
      const result = await startAuditSubmissionAction(templateId);
      if (result?.error) toast.error(result.error);
    });
  }

  if (templates.length === 0) {
    return <p className="text-sm text-muted-foreground">No audit templates available yet.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
      <select
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
        disabled={pending}
      >
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <Button size="sm" disabled={pending || !templateId} onClick={start}>
        {pending ? "Starting…" : "Start audit"}
      </Button>
    </div>
  );
}
