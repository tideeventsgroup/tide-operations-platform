import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { getOrganisation } from "@/lib/domain/admin-service";
import { PageHeader } from "@/components/page-header";
import { OrganisationForm } from "@/components/admin/organisation-form";

export default async function OrganisationAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const organisation = await getOrganisation(profile.organisation_id);

  return (
    <>
      <PageHeader title="Organisation" description="Core organisation details." />
      <OrganisationForm organisation={organisation} />
    </>
  );
}
