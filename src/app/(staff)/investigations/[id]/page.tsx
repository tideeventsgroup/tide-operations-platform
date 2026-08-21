import { notFound } from "next/navigation";
import {
  getInvestigation,
  listInvestigationEvidence,
  listInvestigationIncidents,
  listInvestigationNotes,
  listInvestigationPeople,
  listInvestigationVehicles,
} from "@/lib/domain/investigation-service";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { InvestigationWorkspace } from "@/components/investigations/investigation-workspace";
import { cn } from "@/lib/utils";
import type { Enums } from "@/lib/supabase/types";

const STATUS_CLASS: Record<Enums<"investigation_status">, string> = {
  open: "bg-warning-bg text-warning",
  active: "bg-info-bg text-info",
  closed: "bg-success-bg text-success",
  archived: "bg-muted text-muted-foreground",
};

export default async function InvestigationDetailPage({ params }: PageProps<"/investigations/[id]">) {
  const { id } = await params;

  let investigation;
  try {
    investigation = await getInvestigation(id);
  } catch {
    notFound();
  }

  const [incidents, people, vehicles, evidence, notes] = await Promise.all([
    listInvestigationIncidents(id),
    listInvestigationPeople(id),
    listInvestigationVehicles(id),
    listInvestigationEvidence(id),
    listInvestigationNotes(id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {investigation.reference}
          <span>·</span>
          <Badge variant="secondary" className={cn("font-medium capitalize", STATUS_CLASS[investigation.status])}>
            {investigation.status}
          </Badge>
        </div>
        <PageHeader title={investigation.title} description={investigation.summary ?? undefined} />
        {investigation.lead_investigator ? (
          <p className="text-sm text-muted-foreground">
            Lead: {[investigation.lead_investigator.first_name, investigation.lead_investigator.surname].filter(Boolean).join(" ")}
          </p>
        ) : null}
      </div>

      <InvestigationWorkspace
        investigationId={id}
        organisationId={investigation.organisation_id}
        status={investigation.status}
        incidents={incidents}
        people={people}
        vehicles={vehicles}
        evidence={evidence}
        notes={notes}
      />
    </div>
  );
}
