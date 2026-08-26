import { notFound } from "next/navigation";
import {
  getActiveMajorIncidentActivation,
  getEvent,
  getEventRestrictedNarrative,
  listEventActions,
  listEventAgencies,
  listEventCategories,
  listEventDecisions,
  listEventPeople,
  listEventPriorities,
  listEventResources,
  listEventTimeline,
  listEventVehicles,
  listEvents,
  listMethaneVersions,
} from "@/lib/domain/event-service";
import { listEvidenceItems } from "@/lib/domain/evidence-service";
import { hasPermission } from "@/lib/domain/auth-service";
import { EventCommandHeader } from "@/components/events/event-command-header";
import { EventQuickActions } from "@/components/events/event-quick-actions";
import { EventTimeline } from "@/components/events/event-timeline";
import { EventActionsPanel } from "@/components/events/event-actions-panel";
import { EventDecisionsPanel } from "@/components/events/event-decisions-panel";
import { EventResourcesPanel } from "@/components/events/event-resources-panel";
import { EventAgenciesPanel } from "@/components/events/event-agencies-panel";
import { EventIntelligencePanel } from "@/components/events/event-intelligence-panel";
import { EventEvidencePanel } from "@/components/events/event-evidence-panel";
import { EventRestrictedPanel } from "@/components/events/event-restricted-panel";
import { MethanePanel } from "@/components/events/methane-panel";
import { MajorIncidentBanner } from "@/components/events/major-incident-banner";
import { EventContextRail } from "@/components/events/event-context-rail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function IncidentDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;

  let incident;
  try {
    incident = await getEvent(id);
  } catch {
    notFound();
  }

  const [
    timeline,
    actions,
    decisions,
    resources,
    agencies,
    people,
    vehicles,
    evidence,
    methane,
    majorIncidentActivation,
    categories,
    priorities,
    eventIncidents,
    canViewRestricted,
  ] = await Promise.all([
    listEventTimeline(id),
    listEventActions(id),
    listEventDecisions(id),
    listEventResources(id),
    listEventAgencies(id),
    listEventPeople(id),
    listEventVehicles(id),
    listEvidenceItems(id),
    listMethaneVersions(id),
    getActiveMajorIncidentActivation(id),
    listEventCategories(),
    listEventPriorities(incident.organisation_id),
    listEvents(incident.operation_id),
    hasPermission("event.view_restricted", { organisationId: incident.organisation_id, operationId: incident.operation_id }),
  ]);

  const restrictedNarrative = canViewRestricted ? await getEventRestrictedNarrative(id) : null;

  const category = categories.find((c) => c.code === incident.category_code);
  const priority = priorities.find((p) => p.code === incident.priority_code);
  const otherOpenIncidents = eventIncidents.filter(
    (i) => i.id !== incident.id && i.status !== "closed" && i.status !== "resolved",
  );
  const outstandingActions = actions.filter((a) => a.status === "open" || a.status === "in_progress").length;

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <EventCommandHeader incident={incident} categoryName={category?.name ?? incident.category_code} priority={priority} />
          <MajorIncidentBanner eventId={id} activation={majorIncidentActivation} />
          <EventQuickActions incident={incident} priorities={priorities} />

          <Tabs defaultValue="timeline">
            <TabsList variant="line" className="w-full justify-start border-b border-border">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="actions">
                Actions{outstandingActions > 0 ? ` (${outstandingActions})` : ""}
              </TabsTrigger>
              <TabsTrigger value="decisions">Decisions</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="agencies">Agencies</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              {canViewRestricted ? <TabsTrigger value="restricted">Restricted</TabsTrigger> : null}
              <TabsTrigger value="methane">METHANE</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="pt-4">
              <EventTimeline eventId={id} entries={timeline} />
            </TabsContent>
            <TabsContent value="actions" className="pt-4">
              <EventActionsPanel eventId={id} actions={actions} />
            </TabsContent>
            <TabsContent value="decisions" className="pt-4">
              <EventDecisionsPanel eventId={id} decisions={decisions} />
            </TabsContent>
            <TabsContent value="resources" className="pt-4">
              <EventResourcesPanel eventId={id} resources={resources} />
            </TabsContent>
            <TabsContent value="agencies" className="pt-4">
              <EventAgenciesPanel eventId={id} agencies={agencies} />
            </TabsContent>
            <TabsContent value="intelligence" className="pt-4">
              <EventIntelligencePanel
                eventId={id}
                organisationId={incident.organisation_id}
                people={people}
                vehicles={vehicles}
              />
            </TabsContent>
            <TabsContent value="evidence" className="pt-4">
              <EventEvidencePanel eventId={id} operationId={incident.operation_id} items={evidence} />
            </TabsContent>
            {canViewRestricted ? (
              <TabsContent value="restricted" className="pt-4">
                <EventRestrictedPanel eventId={id} classification={incident.classification} narrative={restrictedNarrative} />
              </TabsContent>
            ) : null}
            <TabsContent value="methane" className="pt-4">
              <MethanePanel eventId={id} data={methane} />
            </TabsContent>
          </Tabs>
        </div>
        <EventContextRail incident={incident} otherOpenIncidents={otherOpenIncidents} />
      </div>
    </div>
  );
}
