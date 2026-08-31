import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listAuditSubmissionsForOrg, listAuditTemplates } from "@/lib/domain/audit-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

function submitterName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "System";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AuditsListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const [submissions, templates] = await Promise.all([
    listAuditSubmissionsForOrg(profile.organisation_id),
    listAuditTemplates(profile.organisation_id),
  ]);

  const today = startOfToday();
  const submittedTemplateIdsToday = new Set(
    submissions.filter((s) => new Date(s.created_at) >= today).map((s) => s.audit_templates?.name),
  );
  const notStartedToday = templates.filter((t) => !submittedTemplateIdsToday.has(t.name));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">
      <PageHeader
        title="Audits"
        actions={
          <Button render={<Link href="/audits/new" />} nativeButton={false}>
            Start audit
          </Button>
        }
      />

      {submissions.length === 0 && notStartedToday.length === 0 ? (
        <EmptyState message="No audit templates yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((s) => {
            const answers = s.audit_answers ?? [];
            const scored = answers.filter((a) => a.response !== "not_applicable");
            const passed = scored.filter((a) => a.response === "pass").length;
            const flagged = scored.filter((a) => a.response === "fail").length;
            const total = scored.length;
            const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
            return (
              <Link
                key={s.id}
                href={`/audits/${s.id}`}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">{s.audit_templates?.name ?? "Audit"}</span>
                  <span className="font-mono text-[11px] font-medium text-primary">{s.id.slice(0, 8)}</span>
                </div>
                {total > 0 ? (
                  <div className="mb-1 flex items-center gap-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: flagged > 0 ? "var(--priority-p2)" : "var(--priority-resolved)" }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {passed}/{total}
                    </span>
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {flagged > 0 ? `${flagged} flagged · ` : ""}
                  {s.status === "submitted" ? "submitted by" : "started by"} {submitterName(s.submitted_by_profile)}
                  {s.operations?.name ? ` · ${s.operations.name}` : ""} ·{" "}
                  {new Date(s.submitted_at ?? s.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </Link>
            );
          })}
          {notStartedToday.map((t) => (
            <div key={t.id} className="rounded-lg border border-dashed border-border bg-card p-4">
              <p className="mb-0.5 font-semibold text-muted-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground/70">Not started today</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
