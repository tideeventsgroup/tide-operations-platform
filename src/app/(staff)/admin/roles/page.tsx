import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listPermissions, listRolesWithPermissions } from "@/lib/domain/admin-service";
import { PageHeader } from "@/components/page-header";
import { CreateRoleForm } from "@/components/admin/create-role-form";
import { RolePermissionMatrix } from "@/components/admin/role-permission-matrix";

export default async function RolesAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const [roles, permissions] = await Promise.all([
    listRolesWithPermissions(profile.organisation_id),
    listPermissions(),
  ]);

  return (
    <>
      <PageHeader title="Roles & Permissions" description="System roles are fixed. Create a custom role to define your own permission set." />
      <CreateRoleForm organisationId={profile.organisation_id} />
      <RolePermissionMatrix roles={roles} permissions={permissions} />
    </>
  );
}
