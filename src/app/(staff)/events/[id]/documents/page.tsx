import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/domain/event-service";
import { listDocumentTypes, listDocuments } from "@/lib/domain/document-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DocumentStatusBadge } from "@/components/status-badges";
import { NewDocumentForm } from "@/components/documents/new-document-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "—";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export default async function EventDocumentsPage({ params }: PageProps<"/events/[id]/documents">) {
  const { id } = await params;

  let event;
  try {
    event = await getEvent(id);
  } catch {
    notFound();
  }

  const [documents, documentTypes] = await Promise.all([listDocuments(id), listDocumentTypes(event.organisation_id)]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <PageHeader title="Document Studio" description={`${event.name} — plans, assessments, and approvals.`} />

      <NewDocumentForm eventId={id} documentTypes={documentTypes} />

      {documents.length === 0 ? (
        <EmptyState message="No documents yet" />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="row-interactive">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <Link href={`/documents/${doc.id}`} className="block">
                      {doc.reference}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/documents/${doc.id}`} className="block font-medium text-foreground">
                      {doc.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.document_types?.name}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{personName(doc.created_by_profile)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
