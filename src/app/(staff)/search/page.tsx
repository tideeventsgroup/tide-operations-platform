import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { getSearchScopes } from "@/lib/domain/search-scopes";
import { listEventCategories, listEventPriorities } from "@/lib/domain/event-service";
import {
  getSearchCounts,
  searchAll,
  searchCategory,
  type SearchEntityType,
  type SearchFilters,
} from "@/lib/domain/search-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { SearchHero } from "@/components/search/search-hero";
import { SearchPills } from "@/components/search/search-pills";
import { SearchFilterSidebar } from "@/components/search/search-filter-sidebar";
import { SearchAllResults } from "@/components/search/search-all-results";
import { SearchResultsTable } from "@/components/search/search-results-table";

const PAGE_SIZE = 25;
const TYPES: SearchEntityType[] = ["operations", "clients", "events", "people", "vehicles", "investigations", "audits"];

function isSearchEntityType(value: string): value is SearchEntityType {
  return (TYPES as string[]).includes(value);
}

const NEW_ACTION: Partial<Record<SearchEntityType, { label: string; href: string }>> = {
  operations: { label: "New operation", href: "/operations/new" },
  clients: { label: "New client", href: "/clients/new" },
  investigations: { label: "New investigation", href: "/investigations/new" },
  audits: { label: "Start an audit", href: "/audits/new" },
};

function splitParam(value: unknown): string[] {
  return typeof value === "string" && value ? value.split(",").filter(Boolean) : [];
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const query = typeof params.q === "string" ? params.q : "";
  const rawType = typeof params.type === "string" ? params.type : undefined;
  const scopes = await getSearchScopes(profile.organisation_id);
  const activeType = rawType && isSearchEntityType(rawType) && scopes[rawType] ? rawType : undefined;

  const counts = await getSearchCounts(profile.organisation_id, query, scopes);

  if (activeType) {
    const n = Number(params.n);
    const limit = Number.isFinite(n) && n > 0 ? n : PAGE_SIZE;
    const filters: SearchFilters = {
      status: splitParam(params.status),
      priorityCode: splitParam(params.priority),
      categoryCode: splitParam(params.category),
      from: typeof params.from === "string" ? params.from : undefined,
      to: typeof params.to === "string" ? params.to : undefined,
    };
    const [{ hits, hasMore }, categories, priorities] = await Promise.all([
      searchCategory(profile.organisation_id, activeType, query, { limit, filters }),
      activeType === "events" ? listEventCategories() : Promise.resolve(undefined),
      activeType === "events" ? listEventPriorities(profile.organisation_id) : Promise.resolve(undefined),
    ]);
    const action = NEW_ACTION[activeType];

    return (
      <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
        <PageHeader
          title="Search"
          actions={
            action ? (
              <Button render={<Link href={action.href} />} nativeButton={false}>
                {action.label}
              </Button>
            ) : undefined
          }
        />
        <SearchHero initialQuery={query} />
        <SearchPills active={activeType} query={query} scopes={scopes} counts={counts} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0 space-y-3">
            {hits.length === 0 ? (
              <EmptyState message={query ? `No matches for "${query}"` : "Nothing here yet"} />
            ) : (
              <>
                <SearchResultsTable hits={hits} sortable />
                {hasMore ? (
                  <Link
                    href={`/search?type=${activeType}${query ? `&q=${encodeURIComponent(query)}` : ""}&n=${limit + PAGE_SIZE}`}
                    className="block text-center text-sm font-medium text-primary hover:underline"
                  >
                    Load more
                  </Link>
                ) : null}
              </>
            )}
          </div>
          <SearchFilterSidebar
            type={activeType}
            status={filters.status ?? []}
            priority={filters.priorityCode ?? []}
            category={filters.categoryCode ?? []}
            from={filters.from ?? ""}
            to={filters.to ?? ""}
            categories={categories?.map((c) => ({ code: c.code, name: c.name }))}
            priorities={priorities?.map((p) => ({ code: p.code, name: p.name }))}
          />
        </div>
      </div>
    );
  }

  const results = await searchAll(profile.organisation_id, query, scopes);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <PageHeader title="Search" />
      <SearchHero initialQuery={query} />
      <SearchPills active="all" query={query} scopes={scopes} counts={counts} />
      <SearchAllResults results={results} scopes={scopes} query={query} />
    </div>
  );
}
