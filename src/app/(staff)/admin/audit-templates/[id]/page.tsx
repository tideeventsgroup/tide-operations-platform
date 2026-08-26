import { notFound } from "next/navigation";
import { getAuditTemplate } from "@/lib/domain/audit-service";
import { PageHeader } from "@/components/page-header";
import { Pill } from "@/components/ui/data-table";
import { EditAuditTemplateForm } from "@/components/admin/edit-audit-template-form";
import { AuditQuestionRows } from "@/components/admin/audit-question-rows";

export default async function AuditTemplateDetailPage({ params }: PageProps<"/admin/audit-templates/[id]">) {
  const { id } = await params;

  let data;
  try {
    data = await getAuditTemplate(id);
  } catch {
    notFound();
  }
  const { template, questions } = data;

  return (
    <>
      <PageHeader
        title={template.name}
        description={template.description ?? undefined}
        actions={<Pill tone={template.is_active ? "success" : "neutral"}>{template.is_active ? "Active" : "Inactive"}</Pill>}
      />
      <EditAuditTemplateForm template={template} />

      <div className="space-y-3">
        <h2 className="section-label">Questions ({questions.length})</h2>
        <AuditQuestionRows templateId={id} questions={questions} />
      </div>
    </>
  );
}
