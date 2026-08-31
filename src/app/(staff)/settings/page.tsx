import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { getOrganisation } from "@/lib/domain/admin-service";
import { listMyRoleGrants } from "@/lib/domain/user-admin-service";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  const [organisation, roleGrants] = await Promise.all([
    profile.organisation_id ? getOrganisation(profile.organisation_id) : Promise.resolve(null),
    listMyRoleGrants(profile.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader title="Settings" description="Your profile, security, and account details." />

      <ProfileForm
        firstName={profile.first_name}
        surname={profile.surname}
        preferredName={profile.preferred_name}
        phone={profile.phone}
      />

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="section-label">Account</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium text-foreground">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Organisation</dt>
            <dd className="font-medium text-foreground">{organisation?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Account type</dt>
            <dd className="font-medium text-foreground capitalize">{profile.account_type}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="font-mono font-medium text-foreground">{formatDate(profile.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="section-label">Your roles</h2>
        {roleGrants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No roles granted yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roleGrants.map((g) => (
              <Badge key={g.id} variant="secondary">
                {g.roles?.name}
                {g.operations ? ` · ${g.operations.name}` : ""}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div>
          <h2 className="section-label">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Light, dark, or match your system.</p>
        </div>
        <ThemeToggle />
      </div>

      <ChangePasswordForm />
    </div>
  );
}
