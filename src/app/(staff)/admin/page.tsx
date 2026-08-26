import { getCurrentProfile } from "@/lib/domain/auth-service";
import {
  listAssignableRoles,
  listOrganisationProfiles,
  listUserRoleGrants,
} from "@/lib/domain/user-admin-service";
import { listOperations } from "@/lib/domain/operation-service";
import { PageHeader } from "@/components/page-header";
import { ApproveUserForm } from "@/components/admin/approve-user-form";
import { RevokeRoleButton } from "@/components/admin/revoke-role-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { StatTile, StatTileGroup } from "@/components/ui/stat-tile";
import { DataTable, DataTableBody, DataTableCell, DataTableRow } from "@/components/ui/data-table";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organisation_id) return null;

  const [profiles, roles, grants, operations] = await Promise.all([
    listOrganisationProfiles(profile.organisation_id),
    listAssignableRoles(),
    listUserRoleGrants(profile.organisation_id),
    listOperations(),
  ]);

  const pending = profiles.filter((p) => p.account_type === "pending");
  const active = profiles.filter((p) => p.account_type !== "pending");
  const grantsByUser = new Map<string, typeof grants>();
  for (const g of grants) {
    grantsByUser.set(g.user_id, [...(grantsByUser.get(g.user_id) ?? []), g]);
  }

  return (
    <>
      <PageHeader title="Users" description="Approve pending accounts and manage role grants." />

      <StatTileGroup columns={3}>
        <StatTile label="Pending approval" value={pending.length} />
        <StatTile label="Organisation members" value={active.length} />
        <StatTile label="Roles granted" value={grants.length} />
      </StatTileGroup>

      <section className="space-y-3">
        <h2 className="section-label">Pending approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState message="No pending requests" />
        ) : (
          <DataTable>
            <DataTableBody>
              {pending.map((p) => (
                <DataTableRow key={p.id}>
                  <DataTableCell primary={[p.first_name, p.surname].filter(Boolean).join(" ") || p.email} secondary={p.email} />
                  <td className="px-4 py-3 align-top text-right">
                    <ApproveUserForm userId={p.id} roles={roles} operations={operations} />
                  </td>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Organisation members ({active.length})</h2>
        {active.length === 0 ? (
          <EmptyState message="No organisation members yet" />
        ) : (
          <DataTable>
            <DataTableBody>
              {active.map((p) => {
                const userGrants = grantsByUser.get(p.id) ?? [];
                return (
                  <DataTableRow key={p.id}>
                    <DataTableCell primary={[p.first_name, p.surname].filter(Boolean).join(" ") || p.email} secondary={p.email} />
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {userGrants.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No role</span>
                        ) : (
                          userGrants.map((g) => (
                            <Badge key={g.id} variant="secondary" className="gap-1.5">
                              {(g as { roles: { name: string } | null }).roles?.name}
                              <RevokeRoleButton userRoleId={g.id} />
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        )}
      </section>
    </>
  );
}
