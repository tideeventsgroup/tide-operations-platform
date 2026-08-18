import { notFound } from "next/navigation";
import {
  getIncident,
  listIncidentCategories,
  listIncidentPriorities,
  listIncidentTimeline,
  listIncidents,
} from "@/lib/domain/incident-service";
import { IncidentCommandHeader } from "@/components/incidents/incident-command-header";
import { IncidentQuickActions } from "@/components/incidents/incident-quick-actions";
import { IncidentTimeline } from "@/components/incidents/incident-timeline";
import { IncidentContextRail } from "@/components/incidents/incident-context-rail";

export default async function IncidentDetailPage({ params }: PageProps<"/incidents/[id]">) {
  const { id } = await params;

  let incident;
  try {
    incident = await getIncident(id);
  } catch {
    notFound();
  }

  const [timeline, categories, priorities, eventIncidents] = await Promise.all([
    listIncidentTimeline(id),
    listIncidentCategories(),
    listIncidentPriorities(incident.organisation_id),
    listIncidents(incident.event_id),
  ]);

  const category = categories.find((c) => c.code === incident.category_code);
  const otherOpenIncidents = eventIncidents.filter(
    (i) => i.id !== incident.id && i.status !== "closed" && i.status !== "resolved",
  );

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <IncidentCommandHeader incident={incident} categoryName={category?.name ?? incident.category_code} />
          <IncidentQuickActions incident={incident} priorities={priorities} />
          <IncidentTimeline incidentId={id} entries={timeline} />
        </div>
        <IncidentContextRail incident={incident} otherOpenIncidents={otherOpenIncidents} />
      </div>
    </div>
  );
}
