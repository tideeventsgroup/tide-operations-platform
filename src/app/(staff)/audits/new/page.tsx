import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/domain/auth-service";
import { listAuditTemplates } from "@/lib/domain/audit-service";
import { PageHeader } from "@/components/page-header";
import { StartAuditForm } from "@/components/audits/start-audit-form";

export default async function NewAuditPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const canSubmit = await hasPermission("site_audit.submit", { organisationId: profile.organisation_id });
  if (!canSubmit) redirect("/search");

  const templates = await listAuditTemplates(profile.organisation_id);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
      <PageHeader title="Start an audit" description="Scored compliance walk-through against a template." />
      <StartAuditForm templates={templates} />
    </div>
  );
}
