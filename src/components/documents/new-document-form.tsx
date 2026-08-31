"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createDocumentAction } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables, Enums } from "@/lib/supabase/types";

const CLASSIFICATIONS: { value: Enums<"classification_level">; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "client", label: "Client" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
  { value: "restricted", label: "Restricted" },
];

export function NewDocumentForm({ operationId, documentTypes }: { operationId: string; documentTypes: Tables<"document_types">[] }) {
  const [open, setOpen] = useState(false);
  const [documentTypeId, setDocumentTypeId] = useState(documentTypes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [classification, setClassification] = useState<Enums<"classification_level">>("internal");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!documentTypeId || !title.trim()) return;
    startTransition(async () => {
      const result = await createDocumentAction(operationId, documentTypeId, title.trim(), classification);
      if (result?.error) toast.error(result.error);
    });
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        New document
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3"
    >
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="doc-type">
          Type
        </label>
        <Select value={documentTypeId} onValueChange={(v) => setDocumentTypeId(v ?? "")}>
          <SelectTrigger id="doc-type" size="sm" disabled={pending}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="doc-title">
          Title
        </label>
        <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-8 w-64" disabled={pending} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="doc-classification">
          Classification
        </label>
        <Select value={classification} onValueChange={(v) => setClassification((v ?? "internal") as Enums<"classification_level">)}>
          <SelectTrigger id="doc-classification" size="sm" disabled={pending}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLASSIFICATIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={pending || !documentTypeId || !title.trim()}>
        {pending ? "Creating…" : "Create"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
        Cancel
      </Button>
    </form>
  );
}
