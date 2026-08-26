import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Flag, LayoutGrid, User, Car } from "lucide-react";
import { getCurrentProfile, hasPermission } from "@/lib/domain/auth-service";
import { getInsightsSummary } from "@/lib/domain/insights-service";
import { listEventCategories } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { EntityCard } from "@/components/ui/entity-card";
import { StatTile, StatTileGroup } from "@/components/ui/stat-tile";
import { DashboardCardHeader } from "@/components/ui/dashboard-card-header";
import { BarList } from "@/components/ui/bar-list";

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
    listEventCategories(),
  ]);
  const categoryByCode = new Map(categories.map((c) => [c.code, c.name]));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-8 py-8">
      <PageHeader title="Insights" description="Strategic analytics across events, people, and vehicles." />

      <div className="rounded-lg border border-border bg-card p-5">
        <DashboardCardHeader icon={ClipboardList} title="Overview" />
        <div className="pt-5">
          <StatTileGroup>
            <StatTile label="Total events" value={summary.totalIncidents} />
            <StatTile label="Open events" value={summary.openIncidents} />
            <StatTile
              label="Open investigations"
              value={
                <>
                  {summary.openInvestigations}
                  <span className="ml-1 text-base font-normal text-muted-foreground">/ {summary.totalInvestigations}</span>
                </>
              }
            />
            <StatTile label="Evidence items" value={summary.totalEvidenceItems} />
          </StatTileGroup>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <DashboardCardHeader
            icon={LayoutGrid}
            title="Events by category"
            action={
              <Link href="/search?type=events" className="text-primary hover:underline">
                View in Search →
              </Link>
            }
          />
          <div className="pt-5">
            {summary.incidentsByCategory.length === 0 ? (
              <EmptyState message="No events recorded" />
            ) : (
              <BarList
                items={summary.incidentsByCategory.map(([code, count]) => ({
                  key: code,
                  label: categoryByCode.get(code) ?? code,
                  value: count,
                }))}
              />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <DashboardCardHeader icon={Flag} title="Events by priority" />
          <div className="pt-5">
            {summary.incidentsByPriority.length === 0 ? (
              <EmptyState message="No prioritised events" />
            ) : (
              <BarList items={summary.incidentsByPriority.map(([code, count]) => ({ key: code, label: code, value: count }))} />
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <DashboardCardHeader
            icon={User}
            title="Most linked people"
            action={
              <Link href="/search?type=people" className="text-primary hover:underline">
                View in Search →
              </Link>
            }
          />
          <div className="space-y-3 pt-5">
            {summary.topPeople.length === 0 ? (
              <EmptyState message="No people linked to events yet" />
            ) : (
              summary.topPeople.map(({ item, count }) => (
                <EntityCard
                  key={item.id}
                  href={`/people/${item.id}`}
                  title={personLabel(item)}
                  reference={item.reference}
                  value={`${count} event${count === 1 ? "" : "s"}`}
                />
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <DashboardCardHeader
            icon={Car}
            title="Most linked vehicles"
            action={
              <Link href="/search?type=vehicles" className="text-primary hover:underline">
                View in Search →
              </Link>
            }
          />
          <div className="space-y-3 pt-5">
            {summary.topVehicles.length === 0 ? (
              <EmptyState message="No vehicles linked to events yet" />
            ) : (
              summary.topVehicles.map(({ item, count }) => (
                <EntityCard
                  key={item.id}
                  href={`/vehicles/${item.id}`}
                  title={vehicleLabel(item)}
                  reference={item.reference}
                  value={`${count} event${count === 1 ? "" : "s"}`}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
