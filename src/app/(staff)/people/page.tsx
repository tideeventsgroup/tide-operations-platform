import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listPeople } from "@/lib/domain/link-analysis-service";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";

function personName(p: { first_name: string | null; surname: string | null; reference: string }) {
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.reference;
}

export default async function PeopleListPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const people = await listPeople();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
      <PageHeader title="People" description="Intelligence records — linked to events, observations, and investigations." />

      {people.length === 0 ? (
        <EmptyState message="No people recorded yet" />
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>Ref</DataTableHeadCell>
            <DataTableHeadCell>Name</DataTableHeadCell>
            <DataTableHeadCell>Purpose</DataTableHeadCell>
            <DataTableHeadCell>Classification</DataTableHeadCell>
            <DataTableHeadCell>Status</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {people.map((p) => (
              <DataTableRow key={p.id}>
                <td className="px-4 py-3 align-top">
                  <Link href={`/people/${p.id}`} className="font-mono text-[11.5px] font-medium text-primary hover:underline">
                    {p.reference}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top">
                  <Link href={`/people/${p.id}`} className="font-medium text-foreground hover:underline">
                    {personName(p)}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top text-sm text-muted-foreground capitalize">{p.purpose}</td>
                <td className="px-4 py-3 align-top">
                  <Badge variant="secondary" className="capitalize">
                    {p.classification}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-top">
                  <Badge variant="secondary" className="capitalize">
                    {p.status}
                  </Badge>
                </td>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
