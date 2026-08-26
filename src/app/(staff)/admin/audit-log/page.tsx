import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listAuditLog, listAuditLogFilters } from "@/lib/domain/admin-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DataTable, DataTableHead, DataTableHeadCell, DataTableBody } from "@/components/ui/data-table";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import { AuditLogRow } from "@/components/admin/audit-log-row";

const PAGE_SIZE = 100;

export default async function AuditLogPage({ searchParams }: PageProps<"/admin/audit-log">) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const entityType = typeof params.entity === "string" ? params.entity : undefined;
  const action = typeof params.action === "string" ? params.action : undefined;
  const n = Number(params.n);
  const limit = Number.isFinite(n) && n > 0 ? n : PAGE_SIZE;

  const [{ entries, hasMore }, filters] = await Promise.all([
    listAuditLog(profile.organisation_id, { entityType, action, limit }),
    listAuditLogFilters(profile.organisation_id),
  ]);

  const qs = new URLSearchParams();
  if (entityType) qs.set("entity", entityType);
  if (action) qs.set("action", action);

  return (
    <>
      <PageHeader title="Audit Log" description="Every logged mutation across the organisation, most recent first." />
      <AuditLogFilters entityTypes={filters.entityTypes} actions={filters.actions} />
      {entries.length === 0 ? (
        <EmptyState message="No audit log entries match these filters" />
      ) : (
        <div className="space-y-3">
          <DataTable>
            <DataTableHead>
              <DataTableHeadCell>When</DataTableHeadCell>
              <DataTableHeadCell>Actor</DataTableHeadCell>
              <DataTableHeadCell>Event</DataTableHeadCell>
              <DataTableHeadCell>Reason</DataTableHeadCell>
              <DataTableHeadCell>State</DataTableHeadCell>
            </DataTableHead>
            <DataTableBody>
              {entries.map((entry) => (
                <AuditLogRow key={entry.id} entry={entry} />
              ))}
            </DataTableBody>
          </DataTable>
          {hasMore ? (
            <Link
              href={`/admin/audit-log?${qs.toString()}${qs.toString() ? "&" : ""}n=${limit + PAGE_SIZE}`}
              className="block text-center text-sm font-medium text-primary hover:underline"
            >
              Load more
            </Link>
          ) : null}
        </div>
      )}
    </>
  );
}
