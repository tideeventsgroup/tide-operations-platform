import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/domain/auth-service";
import { listVehicles } from "@/lib/domain/link-analysis-service";
import { PageHeader } from "@/components/page-header";
import { VehiclesDirectory } from "@/components/link-analysis/vehicles-directory";

export default async function VehiclesDirectoryPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const canView = await hasPermission("intelligence.view", { organisationId: profile.organisation_id });
  if (!canView) redirect("/dashboard");

  const vehicles = await listVehicles(profile.organisation_id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader title="Find a vehicle" description="Search vehicle intelligence records across the organisation." />
      <VehiclesDirectory organisationId={profile.organisation_id} initial={vehicles} />
    </div>
  );
}
