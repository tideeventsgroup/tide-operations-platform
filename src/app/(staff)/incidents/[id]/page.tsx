import { notFound } from "next/navigation";
import { getIncident, listIncidentCategories, listIncidentPriorities, listIncidentTimeline } from "@/lib/domain/incident-service";
import { IncidentCommandHeader } from "@/components/incidents/incident-command-header";
import { IncidentQuickActions } from "@/components/incidents/incident-quick-actions";
import { IncidentTimeline } from "@/components/incidents/incident-timeline";

export default async function IncidentDetailPage({ params }: PageProps<"/incidents/[id]">) {
  const { id } = await params;

  let incident;
  try {
    incident = await getIncident(id);
  } catch {
    notFound();
  }

  const [timeline, categories, priorities] = await Promise.all([
    listIncidentTimeline(id),
    listIncidentCategories(),
    listIncidentPriorities(incident.organisation_id),
  ]);

  const category = categories.find((c) => c.code === incident.category_code);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <IncidentCommandHeader incident={incident} categoryName={category?.name ?? incident.category_code} />
      <IncidentQuickActions incident={incident} priorities={priorities} />
      <IncidentTimeline incidentId={id} entries={timeline} />
    </div>
  );
}
