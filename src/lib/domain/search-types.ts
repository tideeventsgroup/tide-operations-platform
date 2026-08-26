// Plain types/constants shared between the server-only search-service and
// client components (e.g. the filter sidebar). Kept separate from
// search-service.ts so client bundles never pull in its "server-only" import.

export type SearchEntityType = "operations" | "clients" | "events" | "people" | "vehicles" | "investigations" | "audits";

export type SearchFilters = {
  status?: string[];
  priorityCode?: string[];
  categoryCode?: string[];
  from?: string;
  to?: string;
};

export const FILTERABLE_FIELDS: Record<SearchEntityType, { status: boolean; priority: boolean; category: boolean; dateColumn: string | null }> = {
  operations: { status: true, priority: false, category: false, dateColumn: "start_date" },
  // clients.status is a free-text column with no fixed enum in the schema —
  // omitted here rather than rendering checkboxes against guessed values.
  clients: { status: false, priority: false, category: false, dateColumn: null },
  events: { status: true, priority: true, category: true, dateColumn: "occurred_at" },
  people: { status: false, priority: false, category: false, dateColumn: "created_at" },
  vehicles: { status: false, priority: false, category: false, dateColumn: "created_at" },
  investigations: { status: true, priority: false, category: false, dateColumn: null },
  audits: { status: true, priority: false, category: false, dateColumn: null },
};
