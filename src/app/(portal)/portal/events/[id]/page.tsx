import { notFound } from "next/navigation";
import { getPortalEvent, getPortalIncidentSummary, listPortalDocuments } from "@/lib/domain/portal-service";
import { LifecycleStageBadge } from "@/components/status-badges";
import { PortalDocumentList } from "@/components/portal/portal-document-list";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function PortalEventDetailPage({ params }: PageProps<"/portal/events/[id]">) {
  const { id } = await params;

  let event;
  try {
    event = await getPortalEvent(id);
  } catch {
    notFound();
  }

  const [documents, incidentSummary] = await Promise.all([listPortalDocuments(id), getPortalIncidentSummary(id)]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">{event.reference}</div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[28px] leading-none font-bold text-foreground">{event.name}</h1>
          <LifecycleStageBadge stage={event.lifecycle_stage} />
        </div>
        <p className="text-sm text-muted-foreground">
          {event.clients?.trading_name || event.clients?.legal_name} · {formatDate(event.start_date)} — {formatDate(event.end_date)}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Total incidents</div>
          <div className="text-2xl font-bold text-foreground">{incidentSummary?.total_incidents ?? 0}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Open</div>
          <div className="text-2xl font-bold text-foreground">{incidentSummary?.open_incidents ?? 0}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Resolved</div>
          <div className="text-2xl font-bold text-foreground">{incidentSummary?.resolved_incidents ?? 0}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Closed</div>
          <div className="text-2xl font-bold text-foreground">{incidentSummary?.closed_incidents ?? 0}</div>
        </div>
      </section>

      <div className="space-y-3">
        <h2 className="section-label">Documents</h2>
        <PortalDocumentList documents={documents} />
      </div>
    </div>
  );
}
