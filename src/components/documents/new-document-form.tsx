"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createDocumentAction } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tables, Enums } from "@/lib/supabase/types";

export function NewDocumentForm({ eventId, documentTypes }: { eventId: string; documentTypes: Tables<"document_types">[] }) {
  const [open, setOpen] = useState(false);
  const [documentTypeId, setDocumentTypeId] = useState(documentTypes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [classification, setClassification] = useState<Enums<"classification_level">>("internal");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!documentTypeId || !title.trim()) return;
    startTransition(async () => {
      const result = await createDocumentAction(eventId, documentTypeId, title.trim(), classification);
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
        <select
          id="doc-type"
          value={documentTypeId}
          onChange={(e) => setDocumentTypeId(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          disabled={pending}
        >
          {documentTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
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
        <select
          id="doc-classification"
          value={classification}
          onChange={(e) => setClassification(e.target.value as Enums<"classification_level">)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          disabled={pending}
        >
          <option value="public">Public</option>
          <option value="client">Client</option>
          <option value="internal">Internal</option>
          <option value="confidential">Confidential</option>
          <option value="restricted">Restricted</option>
        </select>
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
