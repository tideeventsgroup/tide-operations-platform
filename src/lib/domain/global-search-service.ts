import "server-only";
import { createClient } from "@/lib/supabase/server";

function sanitizeFilterTerm(query: string) {
  return query.replace(/[,()*]/g, "").trim();
}

export async function globalSearch(organisationId: string, query: string) {
  const term = sanitizeFilterTerm(query);
  if (term.length < 2) return { events: [], clients: [], incidents: [] };

  const supabase = await createClient();

  const [eventsResult, clientsResult, incidentsResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, reference, name")
      .eq("organisation_id", organisationId)
      .or(`reference.ilike.%${term}%,name.ilike.%${term}%`)
      .limit(5),
    supabase
      .from("clients")
      .select("id, reference, legal_name, trading_name")
      .eq("organisation_id", organisationId)
      .or(`reference.ilike.%${term}%,legal_name.ilike.%${term}%,trading_name.ilike.%${term}%`)
      .limit(5),
    supabase
      .from("incidents")
      .select("id, reference, summary")
      .eq("organisation_id", organisationId)
      .or(`reference.ilike.%${term}%,summary.ilike.%${term}%`)
      .limit(5),
  ]);

  return {
    events: eventsResult.data ?? [],
    clients: clientsResult.data ?? [],
    incidents: incidentsResult.data ?? [],
  };
}
