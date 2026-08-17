import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { signOut } from "@/lib/actions/auth";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";

export default async function AccountPendingPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/sign-in");
  if (profile.account_type !== "pending") redirect("/dashboard");

  return (
    <AuthShell title="Account pending approval">
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          Your account (<span className="text-foreground">{profile.email}</span>) has been created and is
          waiting for a Tide administrator to approve it and assign your role. You&apos;ll be able to sign in
          once that&apos;s done.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
