import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listOperations } from "@/lib/domain/operation-service";
import { getActivityFeed } from "@/lib/domain/feed-service";
import { ActivityFeed } from "@/components/feed/activity-feed";
import { EntityCard } from "@/components/ui/entity-card";
import { PageHeader } from "@/components/page-header";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/sign-in");

  const events = await listOperations();

  const upcomingEvents = events
    .filter((e) => e.lifecycle_stage !== "live" && e.lifecycle_stage !== "closed" && e.lifecycle_stage !== "archived")
    .filter((e) => e.start_date && new Date(e.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
    .slice(0, 5);

  const feedItems = await getActivityFeed(profile.organisation_id);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
      <PageHeader title={`Welcome${profile.first_name ? `, ${profile.first_name}` : ""}`} />

      {upcomingEvents.length > 0 ? (
        <section className="space-y-3">
          <h2 className="section-label">Upcoming</h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EntityCard
                key={event.id}
                href={`/operations/${event.id}`}
                title={event.name}
                value={formatDate(event.start_date)}
                subtitle={event.clients?.trading_name || event.clients?.legal_name || undefined}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="section-label">Feed</h2>
        <ActivityFeed items={feedItems} />
      </section>
    </div>
  );
}
