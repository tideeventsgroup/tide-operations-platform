import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sanitizeFilterTerm } from "@/lib/domain/postgrest-filter";
import type { Enums } from "@/lib/supabase/types";
import type { SearchEntityType, SearchFilters } from "@/lib/domain/search-types";

export type { SearchEntityType, SearchFilters } from "@/lib/domain/search-types";
export { FILTERABLE_FIELDS } from "@/lib/domain/search-types";

export type SearchBadge =
  | { kind: "operationStage"; value: Enums<"operation_lifecycle_stage"> }
  | { kind: "eventStatus"; value: Enums<"event_status"> }
  | { kind: "clientStatus"; value: string }
  | { kind: "investigationStatus"; value: Enums<"investigation_status"> }
  | { kind: "auditScore"; score: number | null; status: Enums<"audit_submission_status"> };

export type SearchHit = {
  id: string;
  type: SearchEntityType;
  href: string;
  title: string;
  reference: string | null;
  subtitle: string | null;
  meta: string | null;
  badge: SearchBadge | null;
};

export type SearchScopes = {
  operations: boolean;
  clients: boolean;
  events: boolean;
  people: boolean;
  vehicles: boolean;
  investigations: boolean;
  audits: boolean;
};

const DEFAULT_LIMIT = 25;

function applyDateRange<T extends { gte: (col: string, v: string) => T; lte: (col: string, v: string) => T }>(
  query: T,
  column: string,
  filters: SearchFilters,
): T {
  let q = query;
  if (filters.from) q = q.gte(column, filters.from);
  if (filters.to) q = q.lte(column, filters.to);
  return q;
}

async function searchOperations(organisationId: string, term: string, limit: number, offset: number, filters: SearchFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("operations")
    .select("id, reference, name, start_date, current_phase, lifecycle_stage, clients(legal_name, trading_name)")
    .eq("organisation_id", organisationId);
  if (term) query = query.or(`reference.ilike.%${term}%,name.ilike.%${term}%`);
  if (filters.status?.length) query = query.in("lifecycle_stage", filters.status as Enums<"operation_lifecycle_stage">[]);
  query = applyDateRange(query, "start_date", filters);
  const { data, error } = await query.order("start_date", { ascending: false, nullsFirst: false }).range(offset, offset + limit);
  if (error) throw error;
  const rows = data ?? [];
  const hits: SearchHit[] = rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: "operations",
    href: `/operations/${r.id}`,
    title: r.name,
    reference: r.reference,
    subtitle: r.clients?.trading_name || r.clients?.legal_name || null,
    meta: r.start_date,
    badge: { kind: "operationStage", value: r.lifecycle_stage },
  }));
  return { hits, hasMore: rows.length > limit };
}

async function searchClients(organisationId: string, term: string, limit: number, offset: number, filters: SearchFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("id, reference, legal_name, trading_name, city, status")
    .eq("organisation_id", organisationId);
  if (term) query = query.or(`reference.ilike.%${term}%,legal_name.ilike.%${term}%,trading_name.ilike.%${term}%`);
  if (filters.status?.length) query = query.in("status", filters.status);
  const { data, error } = await query.order("legal_name", { ascending: true }).range(offset, offset + limit);
  if (error) throw error;
  const rows = data ?? [];
  const hits: SearchHit[] = rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: "clients",
    href: `/clients/${r.id}`,
    title: r.trading_name || r.legal_name,
    reference: r.reference,
    subtitle: r.city,
    meta: null,
    badge: { kind: "clientStatus", value: r.status },
  }));
  return { hits, hasMore: rows.length > limit };
}

async function searchEvents(organisationId: string, term: string, limit: number, offset: number, filters: SearchFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select("id, reference, summary, status, priority_code, occurred_at, operations(name)")
    .eq("organisation_id", organisationId);
  if (term) query = query.or(`reference.ilike.%${term}%,summary.ilike.%${term}%`);
  if (filters.status?.length) query = query.in("status", filters.status as Enums<"event_status">[]);
  if (filters.priorityCode?.length) query = query.in("priority_code", filters.priorityCode);
  if (filters.categoryCode?.length) query = query.in("category_code", filters.categoryCode);
  query = applyDateRange(query, "occurred_at", filters);
  const { data, error } = await query.order("occurred_at", { ascending: false }).range(offset, offset + limit);
  if (error) throw error;
  const rows = data ?? [];
  const hits: SearchHit[] = rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: "events",
    href: `/events/${r.id}`,
    title: r.summary,
    reference: r.reference,
    subtitle: r.operations?.name ?? null,
    meta: r.occurred_at,
    badge: { kind: "eventStatus", value: r.status },
  }));
  return { hits, hasMore: rows.length > limit };
}

async function searchPeople(organisationId: string, term: string, limit: number, offset: number, filters: SearchFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("people")
    .select("id, reference, first_name, surname, created_at")
    .eq("organisation_id", organisationId)
    .eq("status", "active");
  if (term) query = query.or(`first_name.ilike.%${term}%,surname.ilike.%${term}%,reference.ilike.%${term}%`);
  query = applyDateRange(query, "created_at", filters);
  const { data, error } = await query.order("created_at", { ascending: false }).range(offset, offset + limit);
  if (error) throw error;
  const rows = data ?? [];
  const hits: SearchHit[] = rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: "people",
    href: `/people/${r.id}`,
    title: [r.first_name, r.surname].filter(Boolean).join(" ") || r.reference,
    reference: r.reference,
    subtitle: null,
    meta: null,
    badge: null,
  }));
  return { hits, hasMore: rows.length > limit };
}

async function searchVehicles(organisationId: string, term: string, limit: number, offset: number, filters: SearchFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("vehicles")
    .select("id, reference, registration, make, model, colour, created_at")
    .eq("organisation_id", organisationId)
    .eq("status", "active");
  if (term) query = query.or(`registration.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%,reference.ilike.%${term}%`);
  query = applyDateRange(query, "created_at", filters);
  const { data, error } = await query.order("created_at", { ascending: false }).range(offset, offset + limit);
  if (error) throw error;
  const rows = data ?? [];
  const hits: SearchHit[] = rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: "vehicles",
    href: `/vehicles/${r.id}`,
    title: r.registration || [r.colour, r.make, r.model].filter(Boolean).join(" ") || r.reference,
    reference: r.reference,
    subtitle: [r.make, r.model].filter(Boolean).join(" ") || null,
    meta: null,
    badge: null,
  }));
  return { hits, hasMore: rows.length > limit };
}

async function searchInvestigations(organisationId: string, term: string, limit: number, offset: number, filters: SearchFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("investigations")
    .select("id, reference, title, status, opened_at, lead_investigator:lead_investigator_id(first_name, surname)")
    .eq("organisation_id", organisationId);
  if (term) query = query.or(`reference.ilike.%${term}%,title.ilike.%${term}%`);
  if (filters.status?.length) query = query.in("status", filters.status as Enums<"investigation_status">[]);
  const { data, error } = await query.order("opened_at", { ascending: false }).range(offset, offset + limit);
  if (error) throw error;
  const rows = data ?? [];
  const hits: SearchHit[] = rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: "investigations",
    href: `/investigations/${r.id}`,
    title: r.title,
    reference: r.reference,
    subtitle: r.lead_investigator ? `Led by ${[r.lead_investigator.first_name, r.lead_investigator.surname].filter(Boolean).join(" ")}` : null,
    meta: r.opened_at,
    badge: { kind: "investigationStatus", value: r.status },
  }));
  return { hits, hasMore: rows.length > limit };
}

async function searchAudits(organisationId: string, term: string, limit: number, offset: number, filters: SearchFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("audit_submissions")
    .select(
      "id, score, status, created_at, submitted_by_profile:submitted_by(first_name, surname), operations(name), audit_templates!inner(name)",
    )
    .eq("organisation_id", organisationId);
  if (term) query = query.or("name.ilike.%" + term + "%", { referencedTable: "audit_templates" });
  if (filters.status?.length) query = query.in("status", filters.status as Enums<"audit_submission_status">[]);
  const { data, error } = await query.order("created_at", { ascending: false }).range(offset, offset + limit);
  if (error) throw error;
  const rows = data ?? [];
  const hits: SearchHit[] = rows.slice(0, limit).map((r) => ({
    id: r.id,
    type: "audits",
    href: `/audits/${r.id}`,
    title: r.audit_templates?.name ?? "Audit",
    reference: null,
    subtitle: [
      r.submitted_by_profile ? [r.submitted_by_profile.first_name, r.submitted_by_profile.surname].filter(Boolean).join(" ") : null,
      r.operations?.name,
    ]
      .filter(Boolean)
      .join(" · ") || null,
    meta: r.created_at,
    badge: { kind: "auditScore", score: r.score, status: r.status },
  }));
  return { hits, hasMore: rows.length > limit };
}

const SEARCHERS: Record<SearchEntityType, typeof searchOperations> = {
  operations: searchOperations,
  clients: searchClients,
  events: searchEvents,
  people: searchPeople,
  vehicles: searchVehicles,
  investigations: searchInvestigations,
  audits: searchAudits,
};

export async function searchCategory(
  organisationId: string,
  type: SearchEntityType,
  query: string,
  { limit = DEFAULT_LIMIT, offset = 0, filters = {} }: { limit?: number; offset?: number; filters?: SearchFilters } = {},
): Promise<{ hits: SearchHit[]; hasMore: boolean }> {
  const term = sanitizeFilterTerm(query);
  return SEARCHERS[type](organisationId, term, limit, offset, filters);
}

export async function searchAll(
  organisationId: string,
  query: string,
  scopes: SearchScopes,
): Promise<Record<SearchEntityType, SearchHit[]>> {
  const term = sanitizeFilterTerm(query);
  const types = (Object.keys(SEARCHERS) as SearchEntityType[]).filter((t) => scopes[t]);
  const results = await Promise.all(types.map((t) => SEARCHERS[t](organisationId, term, 3, 0)));
  const out = { operations: [], clients: [], events: [], people: [], vehicles: [], investigations: [], audits: [] } as Record<
    SearchEntityType,
    SearchHit[]
  >;
  types.forEach((t, i) => {
    out[t] = results[i].hits;
  });
  return out;
}

// Counts back the pill row (matching Auror's People/Vehicles/Events/Sites
// counters) — deliberately unfiltered beyond the text query, since the pills
// select which entity type to browse rather than narrow the current list.
export async function getSearchCounts(
  organisationId: string,
  query: string,
  scopes: SearchScopes,
): Promise<Record<SearchEntityType, number>> {
  const term = sanitizeFilterTerm(query);
  const supabase = await createClient();
  const types = (Object.keys(SEARCHERS) as SearchEntityType[]).filter((t) => scopes[t]);

  const countQueries: Record<SearchEntityType, () => Promise<number>> = {
    operations: async () => {
      let q = supabase.from("operations").select("id", { count: "exact", head: true }).eq("organisation_id", organisationId);
      if (term) q = q.or(`reference.ilike.%${term}%,name.ilike.%${term}%`);
      const { count } = await q;
      return count ?? 0;
    },
    clients: async () => {
      let q = supabase.from("clients").select("id", { count: "exact", head: true }).eq("organisation_id", organisationId);
      if (term) q = q.or(`reference.ilike.%${term}%,legal_name.ilike.%${term}%,trading_name.ilike.%${term}%`);
      const { count } = await q;
      return count ?? 0;
    },
    events: async () => {
      let q = supabase.from("events").select("id", { count: "exact", head: true }).eq("organisation_id", organisationId);
      if (term) q = q.or(`reference.ilike.%${term}%,summary.ilike.%${term}%`);
      const { count } = await q;
      return count ?? 0;
    },
    people: async () => {
      let q = supabase
        .from("people")
        .select("id", { count: "exact", head: true })
        .eq("organisation_id", organisationId)
        .eq("status", "active");
      if (term) q = q.or(`first_name.ilike.%${term}%,surname.ilike.%${term}%,reference.ilike.%${term}%`);
      const { count } = await q;
      return count ?? 0;
    },
    vehicles: async () => {
      let q = supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("organisation_id", organisationId)
        .eq("status", "active");
      if (term) q = q.or(`registration.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%,reference.ilike.%${term}%`);
      const { count } = await q;
      return count ?? 0;
    },
    investigations: async () => {
      let q = supabase.from("investigations").select("id", { count: "exact", head: true }).eq("organisation_id", organisationId);
      if (term) q = q.or(`reference.ilike.%${term}%,title.ilike.%${term}%`);
      const { count } = await q;
      return count ?? 0;
    },
    audits: async () => {
      let q = supabase
        .from("audit_submissions")
        .select("id, audit_templates!inner(name)", { count: "exact", head: true })
        .eq("organisation_id", organisationId);
      if (term) q = q.or("name.ilike.%" + term + "%", { referencedTable: "audit_templates" });
      const { count } = await q;
      return count ?? 0;
    },
  };

  const entries = await Promise.all(types.map(async (t) => [t, await countQueries[t]()] as const));
  const out = { operations: 0, clients: 0, events: 0, people: 0, vehicles: 0, investigations: 0, audits: 0 } as Record<
    SearchEntityType,
    number
  >;
  entries.forEach(([t, c]) => {
    out[t] = c;
  });
  return out;
}
