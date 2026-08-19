"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { getPortalDocumentDownloadUrlAction } from "@/lib/actions/portal";
import { Button } from "@/components/ui/button";
import type { listPortalDocuments } from "@/lib/domain/portal-service";

type Document = Awaited<ReturnType<typeof listPortalDocuments>>[number];

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function PortalDocumentList({ documents }: { documents: Document[] }) {
  const [pending, startTransition] = useTransition();

  function download(documentId: string) {
    startTransition(async () => {
      const result = await getPortalDocumentDownloadUrlAction(documentId);
      if (result.error || !result.url) {
        toast.error(result.error ?? "Could not generate download link");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  if (documents.length === 0) {
    return <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">No documents published yet</div>;
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">{doc.title}</p>
            <p className="text-xs text-muted-foreground">
              {doc.document_types?.name}
              {doc.issued_at ? ` · Issued ${formatDate(doc.issued_at)}` : ""}
            </p>
          </div>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => download(doc.id)}>
            Download
          </Button>
        </div>
      ))}
    </div>
  );
}
