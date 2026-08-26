import { notFound } from "next/navigation";
import { getOperation } from "@/lib/domain/operation-service";
import { listOperationReadinessChecks, listReadinessChecklist, listRisks } from "@/lib/domain/risk-service";
import { PageHeader } from "@/components/page-header";
import { NewRiskForm } from "@/components/risk/new-risk-form";
import { RiskRegisterTable } from "@/components/risk/risk-register-table";
import { ReadinessChecklistPanel } from "@/components/risk/readiness-checklist-panel";

export default async function EventRiskPage({ params }: PageProps<"/operations/[id]/risk">) {
  const { id } = await params;

  let event;
  try {
    event = await getOperation(id);
  } catch {
    notFound();
  }

  const [risks, checklistItems, checks] = await Promise.all([
    listRisks(id),
    listReadinessChecklist(event.organisation_id),
    listOperationReadinessChecks(id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
      <PageHeader title="Planning & Risk" description={`${event.name} — risk register and readiness checklist.`} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="section-label">Risk register</h2>
            <NewRiskForm operationId={id} />
          </div>
          <RiskRegisterTable operationId={id} risks={risks} />
        </div>

        <ReadinessChecklistPanel operationId={id} items={checklistItems} checks={checks} />
      </div>
    </div>
  );
}
