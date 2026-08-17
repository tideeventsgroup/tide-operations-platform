import { redirect } from "next/navigation";
import { getCurrentProfile, isAdmin } from "@/lib/domain/auth-service";
import { StaffSidebar } from "@/components/layout/staff-sidebar";
import { StaffHeader } from "@/components/layout/staff-header";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/sign-in");
  if (profile.account_type === "pending") redirect("/account-pending");
  if (profile.status === "disabled") redirect("/sign-in");

  const admin = await isAdmin();

  return (
    <div className="flex h-screen">
      <StaffSidebar isAdmin={admin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <StaffHeader profile={profile} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
