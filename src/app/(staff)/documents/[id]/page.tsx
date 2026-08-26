import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocument, listDocumentStatusHistory, listDocumentVersions } from "@/lib/domain/document-service";
import { DocumentStatusBadge } from "@/components/status-badges";
import { DocumentWorkflowActions } from "@/components/documents/document-workflow-actions";
import { DocumentVersionUpload } from "@/components/documents/document-version-upload";
import { DocumentVersionList } from "@/components/documents/document-version-list";

function personName(p: { first_name: string | null; surname: string | null; email: string } | null | undefined) {
  if (!p) return "—";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

export default async function DocumentDetailPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;

  let document;
  try {
    document = await getDocument(id);
  } catch {
    notFound();
  }

  const [versions, statusHistory] = await Promise.all([listDocumentVersions(id), listDocumentStatusHistory(id)]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {document.reference}
          <span>·</span>
          <Link href={`/operations/${document.operations?.id}/documents`} className="hover:underline">
            {document.operations?.name}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[28px] leading-none font-bold text-foreground">{document.title}</h1>
          <DocumentStatusBadge status={document.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {document.document_types?.name} · {document.classification} · Created by {personName(document.created_by_profile)}
        </p>
        {document.approved_at ? (
          <p className="text-xs text-muted-foreground">
            Approved by {personName(document.approved_by_profile)} · {formatTime(document.approved_at)}
          </p>
        ) : null}
        {document.issued_at ? (
          <p className="text-xs text-muted-foreground">
            Issued by {personName(document.issued_by_profile)} · {formatTime(document.issued_at)}
          </p>
        ) : null}
      </div>

      <DocumentWorkflowActions document={document} />

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="section-label">Versions</h2>
          <DocumentVersionUpload documentId={id} operationId={document.operation_id} />
        </div>
        <DocumentVersionList versions={versions} currentVersionId={document.current_version_id} />
      </div>

      <div className="space-y-3">
        <h2 className="section-label">Status history</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {statusHistory.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No history yet</div>
          ) : (
            statusHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="text-muted-foreground">{h.from_status ?? "—"} → </span>
                  <span className="font-medium text-foreground">{h.to_status}</span>
                  {h.reason ? <span className="text-muted-foreground"> · {h.reason}</span> : null}
                  <span className="text-muted-foreground"> · {personName(h.profiles)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{formatTime(h.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
