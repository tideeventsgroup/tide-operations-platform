import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listOperations } from "@/lib/domain/operation-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LifecycleStageBadge } from "@/components/status-badges";
import { EntityCard } from "@/components/ui/entity-card";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

function formatDate(value: string | null) {
  if (!value) return "Dates TBC";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function OperationsListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const operations = await listOperations();
  const live = operations.filter((o) => o.lifecycle_stage === "live");
  const rest = operations.filter((o) => o.lifecycle_stage !== "live");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
      <PageHeader
        title="Operations"
        actions={
          <Button render={<Link href="/operations/new" />} nativeButton={false}>
            New operation
          </Button>
        }
      />

      {operations.length === 0 ? (
        <EmptyState message="No operations yet" />
      ) : (
        <div className="space-y-6">
          {live.length > 0 ? (
            <section className="space-y-3">
              <h2 className="section-label">Live now ({live.length})</h2>
              <div className="space-y-3">
                {live.map((op) => (
                  <EntityCard
                    key={op.id}
                    href={`/operations/${op.id}`}
                    icon={<ClipboardList className="size-5" />}
                    title={op.name}
                    reference={op.reference}
                    subtitle={op.clients?.trading_name || op.clients?.legal_name || undefined}
                    value={<LifecycleStageBadge stage={op.lifecycle_stage} />}
                    subtitleRight={formatDate(op.start_date)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="section-label">All operations ({rest.length})</h2>
            {rest.length === 0 ? (
              <EmptyState message="Nothing outside live operations" />
            ) : (
              <div className="space-y-3">
                {rest.map((op) => (
                  <EntityCard
                    key={op.id}
                    href={`/operations/${op.id}`}
                    icon={<ClipboardList className="size-5" />}
                    title={op.name}
                    reference={op.reference}
                    subtitle={op.clients?.trading_name || op.clients?.legal_name || undefined}
                    value={<LifecycleStageBadge stage={op.lifecycle_stage} />}
                    subtitleRight={formatDate(op.start_date)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
