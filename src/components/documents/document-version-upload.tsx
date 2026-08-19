"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { uploadDocumentVersionAction } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DocumentVersionUpload({ documentId, eventId }: { documentId: string; eventId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadDocumentVersionAction(documentId, eventId, formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Version uploaded");
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Upload version
      </Button>
    );
  }

  return (
    <form ref={formRef} action={submit} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="doc-file">
          File
        </label>
        <input id="doc-file" name="file" type="file" required disabled={pending} className="text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="doc-notes">
          Notes (optional)
        </label>
        <Input id="doc-notes" name="notes" className="h-8 w-56" disabled={pending} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
        Cancel
      </Button>
    </form>
  );
}
