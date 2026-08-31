import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { searchCategory } from "@/lib/domain/search-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchHero } from "@/components/search/search-hero";
import { EntityCard } from "@/components/ui/entity-card";

// Same constraint as /people/new: create_vehicle() requires an event id,
// so a vehicle record can't exist independent of the event it was first
// observed at. Pick the event here, then add it from Intelligence.
export default async function NewVehiclePage({ searchParams }: PageProps<"/vehicles/new">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const { hits } = await searchCategory(profile.organisation_id, "events", query, { limit: 20 });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader title="New vehicle" description="A vehicle record belongs to the event where it was first observed — pick it below." />
      <SearchHero initialQuery={query} />
      {hits.length === 0 ? (
        <EmptyState message={query ? `No events match "${query}"` : "No events yet"} />
      ) : (
        <div className="space-y-3">
          {hits.map((hit) => (
            <EntityCard key={hit.id} href={`${hit.href}?tab=intelligence`} title={hit.title} reference={hit.reference ?? undefined} subtitle={hit.subtitle ?? undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
