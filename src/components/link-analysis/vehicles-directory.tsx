"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { EntityCard } from "@/components/ui/entity-card";
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
      {list.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">No vehicles found</div>
      ) : (
        <div className="space-y-3">
          {list.map((v) => (
            <EntityCard key={v.id} href={`/vehicles/${v.id}`} title={vehicleLabel(v)} reference={v.reference} />
          ))}
        </div>
      )}
    </div>
  );
}
