import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { searchCategory } from "@/lib/domain/search-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchHero } from "@/components/search/search-hero";
import { EntityCard } from "@/components/ui/entity-card";

// A person record only exists as who-was-where-and-why at a specific
// event — create_person() (the RPC behind it) requires an event id, so
// there's no such thing as a standalone new person independent of one.
// This page is that missing first step: pick the event, then add the
// person from its Intelligence tab, same as adding one mid-investigation.
export default async function NewPersonPage({ searchParams }: PageProps<"/people/new">) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const { hits } = await searchCategory(profile.organisation_id, "events", query, { limit: 20 });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader title="New person" description="A person record belongs to the event where they were first observed — pick it below." />
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
