"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  createPersonAction,
  createVehicleAction,
  linkExistingPersonAction,
  linkExistingVehicleAction,
  searchPeopleAction,
  searchVehiclesAction,
} from "@/lib/actions/event-intelligence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { listEventPeople, listEventVehicles } from "@/lib/domain/event-service";
import type { Enums } from "@/lib/supabase/types";

type PersonLink = Awaited<ReturnType<typeof listEventPeople>>[number];
type VehicleLink = Awaited<ReturnType<typeof listEventVehicles>>[number];
type PersonMatch = { id: string; reference: string; first_name: string | null; surname: string | null; description: string | null };
type VehicleMatch = { id: string; reference: string; registration: string | null; make: string | null; model: string | null; colour: string | null };

const CLASSIFICATIONS: { value: Enums<"classification_level">; label: string }[] = [
  { value: "confidential", label: "Restricted" },
  { value: "restricted", label: "Highly restricted" },
];

function personLabel(p: { first_name?: string | null; surname?: string | null } | null | undefined, fallback: string) {
  const name = [p?.first_name, p?.surname].filter(Boolean).join(" ");
  return name || fallback;
}

function vehicleLabel(v: { registration?: string | null; colour?: string | null; make?: string | null; model?: string | null } | null | undefined, fallback: string) {
  return v?.registration || [v?.colour, v?.make, v?.model].filter(Boolean).join(" ") || fallback;
}

export function EventIntelligencePanel({
  eventId,
  organisationId,
  people,
  vehicles,
}: {
  eventId: string;
  organisationId: string;
  people: PersonLink[];
  vehicles: VehicleLink[];
}) {
  return (
    <div className="space-y-8">
      <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
        Restricted intelligence records. Only visible to roles with intelligence access. Records are created for a
        stated operational purpose, not as a general directory — see the purpose field required below.
      </p>
      <PeopleSection eventId={eventId} organisationId={organisationId} people={people} />
      <VehiclesSection eventId={eventId} organisationId={organisationId} vehicles={vehicles} />
    </div>
  );
}

function PeopleSection({ eventId, organisationId, people }: { eventId: string; organisationId: string; people: PersonLink[] }) {
  const [mode, setMode] = useState<"closed" | "search" | "new">("closed");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<PersonMatch[]>([]);
  const [roleCode, setRoleCode] = useState("");
  const [purpose, setPurpose] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [description, setDescription] = useState("");
  const [classification, setClassification] = useState<Enums<"classification_level">>("restricted");
  const [pending, startTransition] = useTransition();

  function reset() {
    setMode("closed");
    setQuery("");
    setMatches([]);
    setRoleCode("");
    setPurpose("");
    setFirstName("");
    setSurname("");
    setDescription("");
    setClassification("restricted");
  }

  function runSearch(value: string) {
    setQuery(value);
    startTransition(async () => {
      const results = await searchPeopleAction(organisationId, value);
      setMatches(results as PersonMatch[]);
    });
  }

  function linkExisting(personId: string) {
    if (!roleCode.trim()) return;
    startTransition(async () => {
      const result = await linkExistingPersonAction(eventId, personId, roleCode.trim());
      if (result.error) toast.error(result.error);
      else reset();
    });
  }

  function createNew() {
    if (!purpose.trim() || !roleCode.trim()) return;
    startTransition(async () => {
      const result = await createPersonAction(eventId, purpose.trim(), roleCode.trim(), {
        firstName: firstName.trim() || undefined,
        surname: surname.trim() || undefined,
        description: description.trim() || undefined,
        classification,
      });
      if (result.error) toast.error(result.error);
      else reset();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-label">People</h2>
        {mode === "closed" ? (
          <Button size="sm" variant="outline" onClick={() => setMode("search")}>
            Link person
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={reset}>
            Cancel
          </Button>
        )}
      </div>

      {mode === "search" ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <Input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search existing people by name or reference…"
            className="w-full"
            disabled={pending}
            autoFocus
          />
          {matches.length > 0 ? (
            <div className="divide-y divide-border rounded-md border border-border">
              {matches.map((m) => (
                <div key={m.id} className="row-interactive flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{personLabel(m, m.reference)}</p>
                    <p className="font-mono text-[11px] text-primary">{m.reference}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Input
                      value={roleCode}
                      onChange={(e) => setRoleCode(e.target.value)}
                      placeholder="Role (e.g. witness)"
                      className="h-8 w-40"
                      disabled={pending}
                    />
                    <Button size="sm" disabled={pending || !roleCode.trim()} onClick={() => linkExisting(m.id)}>
                      Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <p className="text-xs text-muted-foreground">No matching person records.</p>
          ) : null}
          <button type="button" onClick={() => setMode("new")} className="text-xs font-medium text-primary hover:underline">
            + Create a new person record instead
          </button>
        </div>
      ) : null}

      {mode === "new" ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="person-first-name">First name</Label>
              <Input id="person-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="person-surname">Surname</Label>
              <Input id="person-surname" value={surname} onChange={(e) => setSurname(e.target.value)} disabled={pending} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-description">Description</Label>
            <Input id="person-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" disabled={pending} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="person-role">Role</Label>
              <Input id="person-role" value={roleCode} onChange={(e) => setRoleCode(e.target.value)} placeholder="e.g. witness, subject of concern" disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label>Classification</Label>
              <Select value={classification} onValueChange={(v) => setClassification((v ?? "restricted") as Enums<"classification_level">)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-purpose">Purpose</Label>
            <Input
              id="person-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Why this record is being created (required)"
              disabled={pending}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={pending || !purpose.trim() || !roleCode.trim()} onClick={createNew}>
              {pending ? "Creating…" : "Create and link"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {people.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No people linked</div>
        ) : (
          people.map((link) => (
            <div key={link.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <Link href={`/people/${link.person_id}`} className="block font-medium text-foreground hover:underline">
                  {personLabel(link.people, link.people?.reference ?? "")}
                </Link>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {link.people?.reference} · <span className="capitalize">{link.people?.classification}</span>
                </p>
                {link.notes ? <p className="mt-1 text-sm text-muted-foreground">{link.notes}</p> : null}
              </div>
              <Badge variant="secondary" className="shrink-0">
                {link.role_code}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VehiclesSection({ eventId, organisationId, vehicles }: { eventId: string; organisationId: string; vehicles: VehicleLink[] }) {
  const [mode, setMode] = useState<"closed" | "search" | "new">("closed");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<VehicleMatch[]>([]);
  const [roleCode, setRoleCode] = useState("");
  const [purpose, setPurpose] = useState("");
  const [registration, setRegistration] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [colour, setColour] = useState("");
  const [classification, setClassification] = useState<Enums<"classification_level">>("confidential");
  const [pending, startTransition] = useTransition();

  function reset() {
    setMode("closed");
    setQuery("");
    setMatches([]);
    setRoleCode("");
    setPurpose("");
    setRegistration("");
    setMake("");
    setModel("");
    setColour("");
    setClassification("confidential");
  }

  function runSearch(value: string) {
    setQuery(value);
    startTransition(async () => {
      const results = await searchVehiclesAction(organisationId, value);
      setMatches(results as VehicleMatch[]);
    });
  }

  function linkExisting(vehicleId: string) {
    if (!roleCode.trim()) return;
    startTransition(async () => {
      const result = await linkExistingVehicleAction(eventId, vehicleId, roleCode.trim());
      if (result.error) toast.error(result.error);
      else reset();
    });
  }

  function createNew() {
    if (!purpose.trim() || !roleCode.trim()) return;
    startTransition(async () => {
      const result = await createVehicleAction(eventId, purpose.trim(), roleCode.trim(), {
        registration: registration.trim() || undefined,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        colour: colour.trim() || undefined,
        classification,
      });
      if (result.error) toast.error(result.error);
      else reset();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-label">Vehicles</h2>
        {mode === "closed" ? (
          <Button size="sm" variant="outline" onClick={() => setMode("search")}>
            Link vehicle
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={reset}>
            Cancel
          </Button>
        )}
      </div>

      {mode === "search" ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <Input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search existing vehicles by registration or make/model…"
            className="w-full"
            disabled={pending}
            autoFocus
          />
          {matches.length > 0 ? (
            <div className="divide-y divide-border rounded-md border border-border">
              {matches.map((m) => (
                <div key={m.id} className="row-interactive flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium text-foreground">{vehicleLabel(m, m.reference)}</p>
                    <p className="font-mono text-[11px] text-primary">{m.reference}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Input
                      value={roleCode}
                      onChange={(e) => setRoleCode(e.target.value)}
                      placeholder="Role (e.g. involved)"
                      className="h-8 w-40"
                      disabled={pending}
                    />
                    <Button size="sm" disabled={pending || !roleCode.trim()} onClick={() => linkExisting(m.id)}>
                      Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <p className="text-xs text-muted-foreground">No matching vehicle records.</p>
          ) : null}
          <button type="button" onClick={() => setMode("new")} className="text-xs font-medium text-primary hover:underline">
            + Create a new vehicle record instead
          </button>
        </div>
      ) : null}

      {mode === "new" ? (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-registration">Registration</Label>
              <Input id="vehicle-registration" value={registration} onChange={(e) => setRegistration(e.target.value)} className="font-mono uppercase" disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-colour">Colour</Label>
              <Input id="vehicle-colour" value={colour} onChange={(e) => setColour(e.target.value)} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-make">Make</Label>
              <Input id="vehicle-make" value={make} onChange={(e) => setMake(e.target.value)} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-model">Model</Label>
              <Input id="vehicle-model" value={model} onChange={(e) => setModel(e.target.value)} disabled={pending} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-role">Role</Label>
              <Input id="vehicle-role" value={roleCode} onChange={(e) => setRoleCode(e.target.value)} placeholder="e.g. suspect vehicle" disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label>Classification</Label>
              <Select value={classification} onValueChange={(v) => setClassification((v ?? "confidential") as Enums<"classification_level">)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vehicle-purpose">Purpose</Label>
            <Input
              id="vehicle-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Why this record is being created (required)"
              disabled={pending}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={pending || !purpose.trim() || !roleCode.trim()} onClick={createNew}>
              {pending ? "Creating…" : "Create and link"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {vehicles.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No vehicles linked</div>
        ) : (
          vehicles.map((link) => (
            <div key={link.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <Link href={`/vehicles/${link.vehicle_id}`} className="block font-mono font-medium text-foreground hover:underline">
                  {vehicleLabel(link.vehicles, link.vehicles?.reference ?? "")}
                </Link>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {link.vehicles?.reference} · <span className="capitalize">{link.vehicles?.classification}</span>
                </p>
                {link.notes ? <p className="mt-1 text-sm text-muted-foreground">{link.notes}</p> : null}
              </div>
              <Badge variant="secondary" className="shrink-0">
                {link.role_code}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
