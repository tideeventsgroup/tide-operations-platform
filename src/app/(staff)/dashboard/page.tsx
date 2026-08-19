import Link from "next/link";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { createClient } from "@/lib/supabase/server";

const QUICK_LINKS = [
  { href: "/events", label: "Events", description: "Lifecycle, incident control, documents, risk & readiness." },
  { href: "/clients", label: "Clients", description: "Client register and reusable contacts." },
  { href: "/admin", label: "Administration", description: "Users, roles, and organisation settings." },
];

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
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="row-interactive block space-y-1 rounded-lg border border-border bg-card p-4"
          >
            <p className="font-semibold text-foreground">{link.label}</p>
            <p className="text-sm text-muted-foreground">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
