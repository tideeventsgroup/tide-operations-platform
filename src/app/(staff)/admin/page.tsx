import { getCurrentProfile } from "@/lib/domain/auth-service";
import {
  listAssignableRoles,
  listOrganisationProfiles,
  listUserRoleGrants,
} from "@/lib/domain/user-admin-service";
import { PageHeader } from "@/components/page-header";
import { ApproveUserForm } from "@/components/admin/approve-user-form";
import { RevokeRoleButton } from "@/components/admin/revoke-role-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export default async function AdminUsersPage() {
  const profile = await getCurrentProfile();
  if (!profile?.organisation_id) return null;

  const [profiles, roles, grants] = await Promise.all([
    listOrganisationProfiles(profile.organisation_id),
    listAssignableRoles(),
    listUserRoleGrants(profile.organisation_id),
  ]);

  const pending = profiles.filter((p) => p.account_type === "pending");
  const active = profiles.filter((p) => p.account_type !== "pending");
  const grantsByUser = new Map<string, typeof grants>();
  for (const g of grants) {
    grantsByUser.set(g.user_id, [...(grantsByUser.get(g.user_id) ?? []), g]);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <PageHeader title="Users & Roles" description="Approve pending accounts and manage role grants." />

      <section className="space-y-3">
        <h2 className="section-label">Pending approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <EmptyState message="No pending requests" />
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {[p.first_name, p.surname].filter(Boolean).join(" ") || p.email}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{p.email}</div>
                </div>
                <ApproveUserForm userId={p.id} roles={roles} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="section-label">Organisation members ({active.length})</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {active.map((p) => {
            const userGrants = grantsByUser.get(p.id) ?? [];
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {[p.first_name, p.surname].filter(Boolean).join(" ") || p.email}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{p.email}</div>
                </div>
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
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
