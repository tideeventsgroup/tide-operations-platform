import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission, isAdmin } from "@/lib/domain/auth-service";
import { StaffShell } from "@/components/layout/staff-shell";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/sign-in");
  if (profile.account_type === "pending") redirect("/account-pending");
  if (profile.status === "disabled") redirect("/sign-in");
  if (profile.account_type !== "staff") redirect("/portal");

  const [admin, canViewInvestigations] = await Promise.all([isAdmin(), hasPermission("investigation.view")]);

  return (
    <StaffShell profile={profile} isAdmin={admin} canViewInvestigations={canViewInvestigations}>
      {children}
    </StaffShell>
  );
}
