"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { getDocumentDownloadUrlAction } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import type { listDocumentVersions } from "@/lib/domain/document-service";

type Version = Awaited<ReturnType<typeof listDocumentVersions>>[number];

function uploaderName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "System";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

export function DocumentVersionList({ versions, currentVersionId }: { versions: Version[]; currentVersionId: string | null }) {
  const [pending, startTransition] = useTransition();

  function download(storagePath: string) {
    startTransition(async () => {
      const result = await getDocumentDownloadUrlAction(storagePath);
      if (result.error || !result.url) {
        toast.error(result.error ?? "Could not generate download link");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {versions.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">No versions uploaded</div>
      ) : (
        versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                v{v.version_no} — {v.file_name}
                {v.id === currentVersionId ? <span className="ml-2 text-xs text-info">Current</span> : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {uploaderName(v.profiles)} · {formatTime(v.uploaded_at)}
                {v.file_size ? ` · ${formatSize(v.file_size)}` : ""}
              </p>
              {v.notes ? <p className="text-sm text-muted-foreground">{v.notes}</p> : null}
            </div>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => download(v.storage_path)}>
              Download
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
