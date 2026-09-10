import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { requireCapability } from "@/modules/identity/internal-auth";
import { compareByOperationalPriority } from "@/modules/incidents/vocabulary";
import { EventAccessDeniedError, resolveEventContext, type EventContext } from "@/modules/tenancy/event-context";
import { ControlConsole, type IncidentListItem, type IncidentOption, type LocationOption } from "./control-console";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string }> };
type IncidentRecord = { display_reference: string; id: string; reported_at: string; severity: string; status: string };
type OperationalPeriodRecord = { id: string; status: "open" | "closed"; version: number };
type ActionRecord = { incident_id: string; due_at: string | null };
type ControlData = { event: EventContext; incidents: IncidentListItem[]; operationalPeriod: OperationalPeriodRecord | null; incidentCategories: IncidentOption[]; locations: LocationOption[]; outstandingActions: number; overdueActions: number };

export default async function EventControlPage({ params }: RouteContext) {
  const { eventId } = await params;
  const data = await loadControlData(eventId);

  if (!data) redirect("/access-denied");
  return <ControlConsole event={data.event} incidents={data.incidents} operationalPeriod={data.operationalPeriod} incidentCategories={data.incidentCategories} locations={data.locations} outstandingActions={data.outstandingActions} overdueActions={data.overdueActions} />;
}

async function loadControlData(eventId: string): Promise<ControlData | null> {
  await requireCapability("event.read");
  const client = createServiceSupabaseClient();

  try {
    const event = await resolveEventContext(client, eventId);
    const [{ data, error }, { data: periodData, error: periodError }, { data: categories, error: categoryError }, { data: zones, error: zoneError }, { data: locations, error: locationError }, { data: openActions, error: actionError }] = await Promise.all([
      client
      .from("incidents")
      .select("id, display_reference, status, severity, reported_at")
      .eq("event_id", event.eventId)
      .is("archived_at", null)
      .order("reported_at", { ascending: false })
      .returns<IncidentRecord[]>(),
      client
        .from("operational_periods")
        .select("id, status, version")
        .eq("event_id", event.eventId)
        .eq("status", "open")
        .maybeSingle<OperationalPeriodRecord>(),
      client.from("incident_categories").select("id, label").is("parent_id", null).eq("is_active", true).order("label", { ascending: true }).returns<IncidentOption[]>(),
      client.from("event_zones").select("id, code, name").eq("event_id", event.eventId).order("code", { ascending: true }).returns<{ id: string; code: string; name: string }[]>(),
      client.from("event_locations").select("id, name").eq("event_id", event.eventId).order("name", { ascending: true }).returns<IncidentOption[]>(),
      // Outstanding means assigned, acknowledged or completed but not yet verified
      // or cancelled, matching incident_actions_open_idx.
      client
        .from("incident_actions")
        .select("incident_id, due_at")
        .eq("event_id", event.eventId)
        .not("status", "in", "(verified,cancelled)")
        .returns<ActionRecord[]>(),
    ]);

    if (error || periodError || categoryError || zoneError || locationError || actionError) return null;

    const now = Date.now();
    const actionsByIncident = new Map<string, number>();
    let overdueActions = 0;
    for (const action of openActions ?? []) {
      actionsByIncident.set(action.incident_id, (actionsByIncident.get(action.incident_id) ?? 0) + 1);
      if (action.due_at && new Date(action.due_at).getTime() < now) overdueActions += 1;
    }

    return {
      event,
      incidents: (data ?? [])
        .map((incident) => ({
          displayReference: incident.display_reference,
          id: incident.id,
          reportedAt: incident.reported_at,
          severity: incident.severity,
          status: incident.status,
          openActions: actionsByIncident.get(incident.id) ?? 0,
        }))
        // Event Control reads by seriousness, not by arrival order.
        .sort(compareByOperationalPriority),
      operationalPeriod: periodData,
      incidentCategories: categories ?? [],
      locations: [
        ...(zones ?? []).map((zone) => ({ id: zone.id, label: `Zone ${zone.code} — ${zone.name}`, type: "zone" as const })),
        ...(locations ?? []).map((location) => ({ ...location, type: "location" as const })),
      ],
      outstandingActions: openActions?.length ?? 0,
      overdueActions,
    };
  } catch (error) {
    if (error instanceof EventAccessDeniedError) return null;
    throw error;
  }
}
