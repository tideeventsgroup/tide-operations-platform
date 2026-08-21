import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listInvestigations } from "@/lib/domain/investigation-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { NewInvestigationForm } from "@/components/investigations/new-investigation-form";
import { cn } from "@/lib/utils";
import type { Enums } from "@/lib/supabase/types";

const STATUS_CLASS: Record<Enums<"investigation_status">, string> = {
  open: "bg-warning-bg text-warning",
  active: "bg-info-bg text-info",
  closed: "bg-success-bg text-success",
  archived: "bg-muted text-muted-foreground",
};

export default async function InvestigationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const investigations = await listInvestigations(profile.organisation_id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">
      <PageHeader
        title="Investigations"
        description="Case files linking incidents, people, vehicles, and evidence."
      />

      <NewInvestigationForm organisationId={profile.organisation_id} />

      {investigations.length === 0 ? (
        <EmptyState message="No investigations open" />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {investigations.map((inv) => (
            <Link
              key={inv.id}
              href={`/investigations/${inv.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{inv.title}</p>
                <p className="text-xs text-muted-foreground">
                  {inv.reference}
                  {inv.lead_investigator ? ` · led by ${[inv.lead_investigator.first_name, inv.lead_investigator.surname].filter(Boolean).join(" ")}` : ""}
                </p>
              </div>
              <Badge variant="secondary" className={cn("shrink-0 font-medium capitalize", STATUS_CLASS[inv.status])}>
                {inv.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
