"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { startAuditSubmissionAction } from "@/lib/actions/audits";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
        <SelectTrigger className="flex-1" disabled={pending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" disabled={pending || !templateId} onClick={start}>
        {pending ? "Starting…" : "Start audit"}
      </Button>
    </div>
  );
}
