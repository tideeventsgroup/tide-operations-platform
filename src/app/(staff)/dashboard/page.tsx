import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { getActivityFeed } from "@/lib/domain/feed-service";
import { ActivityFeed } from "@/components/feed/activity-feed";
import { PageHeader } from "@/components/page-header";
import { WelcomeIntro } from "@/components/welcome-intro";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/sign-in");

  const feedItems = await getActivityFeed(profile.organisation_id);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
      <WelcomeIntro name={profile.first_name || "back"} />
      <PageHeader title={`Welcome${profile.first_name ? `, ${profile.first_name}` : ""}`} />

      <section className="space-y-3">
        <h2 className="section-label">Feed</h2>
        <ActivityFeed items={feedItems} />
      </section>
    </div>
  );
}
