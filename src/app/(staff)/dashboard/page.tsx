import { getCurrentProfile } from "@/lib/domain/auth-service";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: organisation } = profile?.organisation_id
    ? await supabase.from("organisations").select("name, code").eq("id", profile.organisation_id).single()
    : { data: null };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {organisation ? `${organisation.name} (${organisation.code})` : "No organisation assigned yet."}
      </p>
      <div className="mt-8 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Foundation phase — clients, events, and Incident Control land in the next build phases.
      </div>
    </div>
  );
}
