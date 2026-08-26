import "server-only";
import { createClient } from "@/lib/supabase/server";

// Rolls up the intelligence-layer modules (people/vehicles/evidence/
// investigations/observations) for one operation, for the post-event report.
// Each count is RLS-scoped to whoever is running the report — a viewer
// without intelligence.view/evidence.view simply sees 0 for those rows
// rather than an error, same fail-safe behaviour as everywhere else these
// permissions gate a read.
export async function getOperationIntelligenceSummary(operationId: string) {
  const supabase = await createClient();

  const [peopleResult, vehiclesResult, evidenceResult, observationsResult, investigationsResult, radioLogResult] = await Promise.all([
    supabase.from("event_people").select("id, events!inner(operation_id)", { count: "exact", head: true }).eq("events.operation_id", operationId),
    supabase.from("event_vehicles").select("id, events!inner(operation_id)", { count: "exact", head: true }).eq("events.operation_id", operationId),
    supabase.from("evidence_items").select("id, events!inner(operation_id)", { count: "exact", head: true }).eq("events.operation_id", operationId),
    supabase.from("observations").select("status").eq("operation_id", operationId),
    supabase
      .from("investigation_events")
      .select("investigation_id, events!inner(operation_id)")
      .eq("events.operation_id", operationId),
    supabase.from("radio_log_entries").select("significant").eq("operation_id", operationId),
  ]);

  const observationsByStatus: Record<string, number> = {};
  for (const obs of observationsResult.data ?? []) {
    observationsByStatus[obs.status] = (observationsByStatus[obs.status] ?? 0) + 1;
  }

  const uniqueInvestigationIds = new Set((investigationsResult.data ?? []).map((row) => row.investigation_id));
  const radioLogEntries = radioLogResult.data ?? [];

  return {
    peopleLinked: peopleResult.count ?? 0,
    vehiclesLinked: vehiclesResult.count ?? 0,
    evidenceItems: evidenceResult.count ?? 0,
    observationsTotal: observationsResult.data?.length ?? 0,
    observationsByStatus,
    investigationsLinked: uniqueInvestigationIds.size,
    radioLogTotal: radioLogEntries.length,
    radioLogSignificant: radioLogEntries.filter((e) => e.significant).length,
  };
}
