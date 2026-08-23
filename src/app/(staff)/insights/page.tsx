import { redirect } from "next/navigation";
import { getCurrentProfile, hasPermission } from "@/lib/domain/auth-service";
import { getInsightsSummary } from "@/lib/domain/insights-service";
import { listIncidentCategories } from "@/lib/domain/incident-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { EntityCard } from "@/components/ui/entity-card";

function personLabel(p: { first_name: string | null; surname: string | null; reference: string }) {
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.reference;
}

function vehicleLabel(v: { registration: string | null; make: string | null; model: string | null; colour: string | null; reference: string }) {
  return v.registration || [v.colour, v.make, v.model].filter(Boolean).join(" ") || v.reference;
}

export default async function InsightsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const canView = await hasPermission("intelligence.view", { organisationId: profile.organisation_id });
  if (!canView) redirect("/dashboard");

  const [summary, categories] = await Promise.all([
    getInsightsSummary(profile.organisation_id),
    listIncidentCategories(),
  ]);
  const categoryByCode = new Map(categories.map((c) => [c.code, c.name]));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-8 py-8">
      <PageHeader title="Insights" description="Strategic analytics across incidents, people, and vehicles." />

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Total incidents</div>
          <div className="text-3xl font-bold text-foreground">{summary.totalIncidents}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Open incidents</div>
          <div className="text-3xl font-bold text-foreground">{summary.openIncidents}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Open investigations</div>
          <div className="text-3xl font-bold text-foreground">
            {summary.openInvestigations}
            <span className="ml-1 text-base font-normal text-muted-foreground">/ {summary.totalInvestigations}</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="section-label mb-1">Evidence items</div>
          <div className="text-3xl font-bold text-foreground">{summary.totalEvidenceItems}</div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="section-label">Incidents by category</h2>
          {summary.incidentsByCategory.length === 0 ? (
            <EmptyState message="No incidents recorded" />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {summary.incidentsByCategory.map(([code, count]) => (
                <div key={code} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-foreground">{categoryByCode.get(code) ?? code}</span>
                  <span className="data-value">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="section-label">Incidents by priority</h2>
          {summary.incidentsByPriority.length === 0 ? (
            <EmptyState message="No prioritised incidents" />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {summary.incidentsByPriority.map(([code, count]) => (
                <div key={code} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-foreground">{code}</span>
                  <span className="data-value">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="section-label">Most linked people</h2>
          {summary.topPeople.length === 0 ? (
            <EmptyState message="No people linked to incidents yet" />
          ) : (
            <div className="space-y-3">
              {summary.topPeople.map(({ item, count }) => (
                <EntityCard
                  key={item.id}
                  href={`/people/${item.id}`}
                  title={personLabel(item)}
                  reference={item.reference}
                  value={`${count} incident${count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="section-label">Most linked vehicles</h2>
          {summary.topVehicles.length === 0 ? (
            <EmptyState message="No vehicles linked to incidents yet" />
          ) : (
            <div className="space-y-3">
              {summary.topVehicles.map(({ item, count }) => (
                <EntityCard
                  key={item.id}
                  href={`/vehicles/${item.id}`}
                  title={vehicleLabel(item)}
                  reference={item.reference}
                  value={`${count} incident${count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
