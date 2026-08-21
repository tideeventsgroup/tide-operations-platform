import "server-only";
import { createClient } from "@/lib/supabase/server";

// Rolls up the intelligence-layer modules (people/vehicles/evidence/
// investigations/observations) for one event, for the post-event report.
// Each count is RLS-scoped to whoever is running the report — a viewer
// without intelligence.view/evidence.view simply sees 0 for those rows
// rather than an error, same fail-safe behaviour as everywhere else these
// permissions gate a read.
export async function getEventIntelligenceSummary(eventId: string) {
  const supabase = await createClient();

  const [peopleResult, vehiclesResult, evidenceResult, observationsResult, investigationsResult] = await Promise.all([
    supabase.from("incident_people").select("id, incidents!inner(event_id)", { count: "exact", head: true }).eq("incidents.event_id", eventId),
    supabase.from("incident_vehicles").select("id, incidents!inner(event_id)", { count: "exact", head: true }).eq("incidents.event_id", eventId),
    supabase.from("evidence_items").select("id, incidents!inner(event_id)", { count: "exact", head: true }).eq("incidents.event_id", eventId),
    supabase.from("observations").select("status").eq("event_id", eventId),
    supabase
      .from("investigation_incidents")
      .select("investigation_id, incidents!inner(event_id)")
      .eq("incidents.event_id", eventId),
  ]);

  const observationsByStatus: Record<string, number> = {};
  for (const obs of observationsResult.data ?? []) {
    observationsByStatus[obs.status] = (observationsByStatus[obs.status] ?? 0) + 1;
  }

  const uniqueInvestigationIds = new Set((investigationsResult.data ?? []).map((row) => row.investigation_id));

  return {
    peopleLinked: peopleResult.count ?? 0,
    vehiclesLinked: vehiclesResult.count ?? 0,
    evidenceItems: evidenceResult.count ?? 0,
    observationsTotal: observationsResult.data?.length ?? 0,
    observationsByStatus,
    investigationsLinked: uniqueInvestigationIds.size,
  };
}
