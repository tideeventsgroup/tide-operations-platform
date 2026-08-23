import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listInvestigations } from "@/lib/domain/investigation-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { EntityCard } from "@/components/ui/entity-card";
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
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <PageHeader
        title="Investigations"
        description="Case files linking incidents, people, vehicles, and evidence."
      />

      <NewInvestigationForm organisationId={profile.organisation_id} />

      {investigations.length === 0 ? (
        <EmptyState message="No investigations open" />
      ) : (
        <div className="space-y-3">
          {investigations.map((inv) => (
            <EntityCard
              key={inv.id}
              href={`/investigations/${inv.id}`}
              title={inv.title}
              reference={inv.reference}
              value={
                <Badge variant="secondary" className={cn("font-medium capitalize", STATUS_CLASS[inv.status])}>
                  {inv.status}
                </Badge>
              }
              subtitle={
                inv.lead_investigator
                  ? `Led by ${[inv.lead_investigator.first_name, inv.lead_investigator.surname].filter(Boolean).join(" ")}`
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
