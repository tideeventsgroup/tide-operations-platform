import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/domain/auth-service";
import { listPeople } from "@/lib/domain/link-analysis-service";
import { PageHeader } from "@/components/page-header";
import { PeopleDirectory } from "@/components/link-analysis/people-directory";

export default async function PeopleDirectoryPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const canView = await hasPermission("intelligence.view", { organisationId: profile.organisation_id });
  if (!canView) redirect("/dashboard");

  const people = await listPeople(profile.organisation_id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader title="Find a person" description="Search person intelligence records across the organisation." />
      <PeopleDirectory organisationId={profile.organisation_id} initial={people} />
    </div>
  );
}
