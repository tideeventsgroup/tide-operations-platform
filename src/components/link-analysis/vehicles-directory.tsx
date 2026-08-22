"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { searchVehiclesAction } from "@/lib/actions/incident-intelligence";

type Vehicle = { id: string; reference: string; registration: string | null; make: string | null; model: string | null };

function vehicleLabel(v: Vehicle) {
  return v.registration || [v.make, v.model].filter(Boolean).join(" ") || v.reference;
}

export function VehiclesDirectory({ organisationId, initial }: { organisationId: string; initial: Vehicle[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Vehicle[] | null>(null);
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    startTransition(async () => {
      const matches = await searchVehiclesAction(organisationId, value);
      setResults(matches);
    });
  }

  const list = results ?? initial;

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => runSearch(e.target.value)}
        placeholder="Search vehicles by registration or make/model…"
        disabled={pending}
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {list.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No vehicles found</div>
        ) : (
          list.map((v) => (
            <Link key={v.id} href={`/vehicles/${v.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/50">
              <p className="font-medium text-foreground">{vehicleLabel(v)}</p>
              <p className="text-xs text-muted-foreground">{v.reference}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
