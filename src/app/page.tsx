import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";

export default async function RootPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/sign-in");
  if (profile.account_type === "pending") redirect("/account-pending");
  redirect("/dashboard");
}
