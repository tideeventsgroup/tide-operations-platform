"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { DataTable, DataTableBody, DataTableHead, DataTableHeadCell, DataTableRow } from "@/components/ui/data-table";
import { searchPeopleAction } from "@/lib/actions/incident-intelligence";

type Person = { id: string; reference: string; first_name: string | null; surname: string | null };

function personName(p: Person) {
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.reference;
}

export function PeopleDirectory({ organisationId, initial }: { organisationId: string; initial: Person[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[] | null>(null);
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    startTransition(async () => {
      const matches = await searchPeopleAction(organisationId, value);
      setResults(matches);
    });
  }

  const list = results ?? initial;

  return (
    <div className="space-y-3">
      <Input value={query} onChange={(e) => runSearch(e.target.value)} placeholder="Search people by name or reference…" disabled={pending} />
      {list.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">No people found</div>
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableHeadCell>Reference</DataTableHeadCell>
            <DataTableHeadCell>Person</DataTableHeadCell>
          </DataTableHead>
          <DataTableBody>
            {list.map((p) => (
              <DataTableRow key={p.id}>
                <td className="px-4 py-3 align-top">
                  <Link href={`/people/${p.id}`} className="font-medium text-primary hover:underline">
                    {p.reference}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top font-medium text-foreground">{personName(p)}</td>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
