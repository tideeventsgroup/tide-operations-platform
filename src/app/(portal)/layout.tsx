import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { PortalHeader } from "@/components/layout/portal-header";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/sign-in");
  if (profile.account_type === "pending") redirect("/account-pending");
  if (profile.status === "disabled") redirect("/sign-in");
  if (profile.account_type === "staff") redirect("/dashboard");

  return (
    <div className="flex h-screen flex-col">
      <PortalHeader profile={profile} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
