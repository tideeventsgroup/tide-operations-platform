import "server-only";
import { createClient } from "@/lib/supabase/server";

function topN<T>(counts: Map<string, { count: number; item: T }>, n: number) {
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// Org-wide analytics rollup — Auror's "Insights" module equivalent. Every
// query here is RLS-scoped to whoever calls it; a viewer without
// intelligence.view/evidence.view simply gets empty top-people/vehicles
// lists rather than an error, same fail-safe pattern used elsewhere.
export async function getInsightsSummary(organisationId: string) {
  const supabase = await createClient();

  const [peopleLinksResult, vehicleLinksResult, incidentsResult, investigationsResult, evidenceResult] = await Promise.all([
    supabase
      .from("event_people")
      .select("person_id, role_code, people(id, reference, first_name, surname), events!inner(organisation_id)")
      .eq("events.organisation_id", organisationId),
    supabase
      .from("event_vehicles")
      .select("vehicle_id, role_code, vehicles(id, reference, registration, make, model, colour), events!inner(organisation_id)")
      .eq("events.organisation_id", organisationId),
    supabase.from("events").select("category_code, priority_code, status").eq("organisation_id", organisationId),
    supabase.from("investigations").select("id, status").eq("organisation_id", organisationId),
    supabase
      .from("evidence_items")
      .select("id, events!inner(organisation_id)", { count: "exact", head: true })
      .eq("events.organisation_id", organisationId),
  ]);

  type PeopleLink = NonNullable<typeof peopleLinksResult.data>[number];
  const peopleCounts = new Map<string, { count: number; item: NonNullable<PeopleLink["people"]> }>();
  for (const link of peopleLinksResult.data ?? []) {
    if (!link.people) continue;
    const existing = peopleCounts.get(link.person_id);
    if (existing) existing.count += 1;
    else peopleCounts.set(link.person_id, { count: 1, item: link.people });
  }

  type VehicleLink = NonNullable<typeof vehicleLinksResult.data>[number];
  const vehicleCounts = new Map<string, { count: number; item: NonNullable<VehicleLink["vehicles"]> }>();
  for (const link of vehicleLinksResult.data ?? []) {
    if (!link.vehicles) continue;
    const existing = vehicleCounts.get(link.vehicle_id);
    if (existing) existing.count += 1;
    else vehicleCounts.set(link.vehicle_id, { count: 1, item: link.vehicles });
  }

  const incidents = incidentsResult.data ?? [];
  const byCategory = new Map<string, number>();
  const byPriority = new Map<string, number>();
  let openCount = 0;
  for (const incident of incidents) {
    byCategory.set(incident.category_code, (byCategory.get(incident.category_code) ?? 0) + 1);
    if (incident.priority_code) byPriority.set(incident.priority_code, (byPriority.get(incident.priority_code) ?? 0) + 1);
    if (incident.status !== "closed" && incident.status !== "resolved") openCount += 1;
  }

  const investigations = investigationsResult.data ?? [];

  return {
    topPeople: topN(peopleCounts, 5),
    topVehicles: topN(vehicleCounts, 5),
    totalIncidents: incidents.length,
    openIncidents: openCount,
    incidentsByCategory: Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]),
    incidentsByPriority: Array.from(byPriority.entries()).sort((a, b) => b[1] - a[1]),
    openInvestigations: investigations.filter((i) => i.status === "open" || i.status === "active").length,
    totalInvestigations: investigations.length,
    totalEvidenceItems: evidenceResult.count ?? 0,
  };
}
