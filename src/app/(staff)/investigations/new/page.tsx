import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/domain/auth-service";
import { PageHeader } from "@/components/page-header";
import { NewInvestigationForm } from "@/components/investigations/new-investigation-form";

export default async function NewInvestigationPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const canView = await hasPermission("investigation.view", { organisationId: profile.organisation_id });
  if (!canView) redirect("/search");

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
      <PageHeader title="New investigation" description="Open a case file linking events, people, vehicles, and evidence." />
      <NewInvestigationForm organisationId={profile.organisation_id} initialOpen />
    </div>
  );
}
