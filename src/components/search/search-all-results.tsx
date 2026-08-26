import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SearchResultsTable } from "@/components/search/search-results-table";
import type { SearchEntityType, SearchHit, SearchScopes } from "@/lib/domain/search-service";

const LABEL: Record<SearchEntityType, string> = {
  operations: "Operations",
  clients: "Clients",
  events: "Events",
  people: "People",
  vehicles: "Vehicles",
  investigations: "Investigations",
  audits: "Audits",
};

const ORDER: SearchEntityType[] = ["operations", "events", "clients", "people", "vehicles", "investigations", "audits"];

export function SearchAllResults({
  results,
  scopes,
  query,
}: {
  results: Record<SearchEntityType, SearchHit[]>;
  scopes: SearchScopes;
  query: string;
}) {
  const visible = ORDER.filter((t) => scopes[t]);
  const hasAny = visible.some((t) => results[t].length > 0);

  if (!hasAny) {
    return <EmptyState message={query ? `No results for "${query}"` : "No records yet"} />;
  }

  return (
    <div className="space-y-6">
      {visible.map((type) =>
        results[type].length > 0 ? (
          <section key={type} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="section-label">{LABEL[type]}</h2>
              <Link
                href={`/search?type=${type}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className="text-sm text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
            <SearchResultsTable hits={results[type]} />
          </section>
        ) : null,
      )}
    </div>
  );
}
