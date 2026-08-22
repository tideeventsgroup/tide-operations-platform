"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
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
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {list.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No people found</div>
        ) : (
          list.map((p) => (
            <Link key={p.id} href={`/people/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/50">
              <p className="font-medium text-foreground">{personName(p)}</p>
              <p className="text-xs text-muted-foreground">{p.reference}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
