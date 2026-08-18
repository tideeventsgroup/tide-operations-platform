import { notFound } from "next/navigation";
import {
  getIncident,
  listIncidentActions,
  listIncidentCategories,
  listIncidentDecisions,
  listIncidentPriorities,
  listIncidentResources,
  listIncidentTimeline,
  listIncidents,
} from "@/lib/domain/incident-service";
import { IncidentCommandHeader } from "@/components/incidents/incident-command-header";
import { IncidentQuickActions } from "@/components/incidents/incident-quick-actions";
import { IncidentTimeline } from "@/components/incidents/incident-timeline";
import { IncidentActionsPanel } from "@/components/incidents/incident-actions-panel";
import { IncidentDecisionsPanel } from "@/components/incidents/incident-decisions-panel";
import { IncidentResourcesPanel } from "@/components/incidents/incident-resources-panel";
import { IncidentContextRail } from "@/components/incidents/incident-context-rail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function IncidentDetailPage({ params }: PageProps<"/incidents/[id]">) {
  const { id } = await params;

  let incident;
  try {
    incident = await getIncident(id);
  } catch {
    notFound();
  }

  const [timeline, actions, decisions, resources, categories, priorities, eventIncidents] = await Promise.all([
    listIncidentTimeline(id),
    listIncidentActions(id),
    listIncidentDecisions(id),
    listIncidentResources(id),
    listIncidentCategories(),
    listIncidentPriorities(incident.organisation_id),
    listIncidents(incident.event_id),
  ]);

  const category = categories.find((c) => c.code === incident.category_code);
  const otherOpenIncidents = eventIncidents.filter(
    (i) => i.id !== incident.id && i.status !== "closed" && i.status !== "resolved",
  );
  const outstandingActions = actions.filter((a) => a.status === "open" || a.status === "in_progress").length;

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <IncidentCommandHeader incident={incident} categoryName={category?.name ?? incident.category_code} />
          <IncidentQuickActions incident={incident} priorities={priorities} />

          <Tabs defaultValue="timeline">
            <TabsList variant="line" className="w-full justify-start border-b border-border">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="actions">
                Actions{outstandingActions > 0 ? ` (${outstandingActions})` : ""}
              </TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="pt-4">
              <IncidentTimeline incidentId={id} entries={timeline} />
            </TabsContent>
            <TabsContent value="actions" className="pt-4">
              <IncidentActionsPanel incidentId={id} actions={actions} />
            </TabsContent>
            <TabsContent value="decisions" className="pt-4">
              <IncidentDecisionsPanel incidentId={id} decisions={decisions} />
            </TabsContent>
            <TabsContent value="resources" className="pt-4">
              <IncidentResourcesPanel incidentId={id} resources={resources} />
            </TabsContent>
          </Tabs>
        </div>
        <IncidentContextRail incident={incident} otherOpenIncidents={otherOpenIncidents} />
      </div>
    </div>
  );
}
