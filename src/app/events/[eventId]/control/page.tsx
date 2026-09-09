import { redirect } from "next/navigation";
import { createServiceSupabaseClient } from "@/modules/data/supabase-service";
import { requireCapability } from "@/modules/identity/internal-auth";
import { EventAccessDeniedError, resolveEventContext, type EventContext } from "@/modules/tenancy/event-context";
import { ControlConsole, type IncidentListItem } from "./control-console";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string }> };
type IncidentRecord = { display_reference: string; id: string; reported_at: string; severity: string; status: string };
type OperationalPeriodRecord = { id: string; status: "open" | "closed"; version: number };
type ControlData = { event: EventContext; incidents: IncidentListItem[]; operationalPeriod: OperationalPeriodRecord | null };

export default async function EventControlPage({ params }: RouteContext) {
  const { eventId } = await params;
  const data = await loadControlData(eventId);

  if (!data) redirect("/access-denied");
  return <ControlConsole event={data.event} incidents={data.incidents} operationalPeriod={data.operationalPeriod} />;
}

async function loadControlData(eventId: string): Promise<ControlData | null> {
  await requireCapability("event.read");
  const client = createServiceSupabaseClient();

  try {
    const event = await resolveEventContext(client, eventId);
    const [{ data, error }, { data: periodData, error: periodError }] = await Promise.all([
      client
      .from("incidents")
      .select("id, display_reference, status, severity, reported_at")
      .eq("event_id", event.eventId)
      .order("reported_at", { ascending: false })
      .returns<IncidentRecord[]>(),
      client
        .from("operational_periods")
        .select("id, status, version")
        .eq("event_id", event.eventId)
        .eq("status", "open")
        .maybeSingle<OperationalPeriodRecord>(),
    ]);

    if (error || periodError) return null;

    return {
      event,
      incidents: (data ?? []).map((incident) => ({
        displayReference: incident.display_reference,
        id: incident.id,
        reportedAt: incident.reported_at,
        severity: incident.severity,
        status: incident.status,
      })),
      operationalPeriod: periodData,
    };
  } catch (error) {
    if (error instanceof EventAccessDeniedError) return null;
    throw error;
  }
}
