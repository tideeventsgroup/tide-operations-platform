import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listControlRoles } from "@/lib/domain/operation-service";
import { PageHeader } from "@/components/page-header";
import { ControlRoleRows } from "@/components/admin/control-role-rows";

export default async function ControlRolesAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const controlRoles = await listControlRoles(profile.organisation_id);

  return (
    <>
      <PageHeader title="Control Roles" description="Duty-roster roles available when signing on to a control session." />
      <ControlRoleRows organisationId={profile.organisation_id} controlRoles={controlRoles} />
    </>
  );
}
