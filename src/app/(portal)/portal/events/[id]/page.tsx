import { notFound } from "next/navigation";
import { getPortalEvent, getPortalIncidentSummary, listPortalDocuments } from "@/lib/domain/portal-service";
import { LifecycleStageBadge } from "@/components/status-badges";
import { PortalDocumentList } from "@/components/portal/portal-document-list";
import { StatTile, StatTileGroup } from "@/components/ui/stat-tile";

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

      <StatTileGroup>
        <StatTile label="Total incidents" value={incidentSummary?.total_incidents ?? 0} />
        <StatTile label="Open" value={incidentSummary?.open_incidents ?? 0} />
        <StatTile label="Resolved" value={incidentSummary?.resolved_incidents ?? 0} />
        <StatTile label="Closed" value={incidentSummary?.closed_incidents ?? 0} />
      </StatTileGroup>

      <div className="space-y-3">
        <h2 className="section-label">Documents</h2>
        <PortalDocumentList documents={documents} />
      </div>
    </div>
  );
}
