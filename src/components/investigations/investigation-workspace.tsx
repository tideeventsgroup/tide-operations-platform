"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  addInvestigationNoteAction,
  linkEvidenceToInvestigationAction,
  linkIncidentToInvestigationAction,
  linkPersonToInvestigationAction,
  linkVehicleToInvestigationAction,
  searchEvidenceItemsAction,
  searchIncidentsAction,
  updateInvestigationStatusAction,
} from "@/lib/actions/investigations";
import { searchPeopleAction, searchVehiclesAction } from "@/lib/actions/incident-intelligence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  listInvestigationEvidence,
  listInvestigationIncidents,
  listInvestigationNotes,
  listInvestigationPeople,
  listInvestigationVehicles,
} from "@/lib/domain/investigation-service";
import type { Enums } from "@/lib/supabase/types";

type InvestigationIncident = Awaited<ReturnType<typeof listInvestigationIncidents>>[number];
type InvestigationPerson = Awaited<ReturnType<typeof listInvestigationPeople>>[number];
type InvestigationVehicle = Awaited<ReturnType<typeof listInvestigationVehicles>>[number];
type InvestigationEvidence = Awaited<ReturnType<typeof listInvestigationEvidence>>[number];
type InvestigationNote = Awaited<ReturnType<typeof listInvestigationNotes>>[number];
type InvestigationStatus = Enums<"investigation_status">;

const NEXT_STATUS: Partial<Record<InvestigationStatus, InvestigationStatus>> = {
  open: "active",
};

function personLabel(p: { first_name?: string | null; surname?: string | null } | null | undefined, fallback: string) {
  return [p?.first_name, p?.surname].filter(Boolean).join(" ") || fallback;
}

function vehicleLabel(v: { registration?: string | null; make?: string | null; model?: string | null } | null | undefined, fallback: string) {
  return v?.registration || [v?.make, v?.model].filter(Boolean).join(" ") || fallback;
}

export function InvestigationWorkspace({
  investigationId,
  organisationId,
  status,
  incidents,
  people,
  vehicles,
  evidence,
  notes,
}: {
  investigationId: string;
  organisationId: string;
  status: InvestigationStatus;
  incidents: InvestigationIncident[];
  people: InvestigationPerson[];
  vehicles: InvestigationVehicle[];
  evidence: InvestigationEvidence[];
  notes: InvestigationNote[];
}) {
  return (
    <div className="space-y-6">
      <StatusControls investigationId={investigationId} status={status} />

      <Tabs defaultValue="incidents">
        <TabsList variant="line" className="w-full justify-start border-b border-border">
          <TabsTrigger value="incidents">Incidents ({incidents.length})</TabsTrigger>
          <TabsTrigger value="people">People ({people.length})</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({evidence.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="pt-4">
          <IncidentsSection investigationId={investigationId} organisationId={organisationId} incidents={incidents} />
        </TabsContent>
        <TabsContent value="people" className="pt-4">
          <PeopleSection investigationId={investigationId} organisationId={organisationId} people={people} />
        </TabsContent>
        <TabsContent value="vehicles" className="pt-4">
          <VehiclesSection investigationId={investigationId} organisationId={organisationId} vehicles={vehicles} />
        </TabsContent>
        <TabsContent value="evidence" className="pt-4">
          <EvidenceSection investigationId={investigationId} organisationId={organisationId} evidence={evidence} />
        </TabsContent>
        <TabsContent value="notes" className="pt-4">
          <NotesSection investigationId={investigationId} notes={notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusControls({ investigationId, status }: { investigationId: string; status: InvestigationStatus }) {
  const [closing, setClosing] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const next = NEXT_STATUS[status];

  function advance(newStatus: InvestigationStatus, reasonText?: string) {
    startTransition(async () => {
      const result = await updateInvestigationStatusAction(investigationId, newStatus, reasonText);
      if (result.error) toast.error(result.error);
      else setClosing(false);
    });
  }

  if (status === "closed" || status === "archived") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => advance(next)}>
          Mark active
        </Button>
      ) : null}
      {!closing ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setClosing(true)}>
          Close investigation
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for closing" className="w-64" disabled={pending} />
          <Button size="sm" variant="destructive" disabled={pending || !reason.trim()} onClick={() => advance("closed", reason.trim())}>
            Confirm close
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setClosing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

function IncidentsSection({ investigationId, organisationId, incidents }: { investigationId: string; organisationId: string; incidents: InvestigationIncident[] }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<{ id: string; reference: string; summary: string; status: string }[]>([]);
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    startTransition(async () => {
      setMatches(await searchIncidentsAction(organisationId, value));
    });
  }

  function link(incidentId: string) {
    startTransition(async () => {
      const result = await linkIncidentToInvestigationAction(investigationId, incidentId);
      if (result.error) toast.error(result.error);
      else {
        setQuery("");
        setMatches([]);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Input value={query} onChange={(e) => runSearch(e.target.value)} placeholder="Search incidents by reference or summary…" disabled={pending} />
        {matches.length > 0 ? (
          <div className="divide-y divide-border rounded-md border border-border">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{m.summary}</p>
                  <p className="text-xs text-muted-foreground">{m.reference}</p>
                </div>
                <Button size="sm" disabled={pending} onClick={() => link(m.id)}>
                  Link
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {incidents.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No incidents linked</div>
        ) : (
          incidents.map((link) => (
            <Link key={link.id} href={`/incidents/${link.incidents?.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-accent/50">
              <div>
                <p className="font-medium text-foreground">{link.incidents?.summary}</p>
                <p className="text-xs text-muted-foreground">{link.incidents?.reference}</p>
              </div>
              <Badge variant="secondary">{link.incidents?.status}</Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function PeopleSection({ investigationId, organisationId, people }: { investigationId: string; organisationId: string; people: InvestigationPerson[] }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<{ id: string; reference: string; first_name: string | null; surname: string | null }[]>([]);
  const [roleCode, setRoleCode] = useState("");
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    startTransition(async () => {
      const results = await searchPeopleAction(organisationId, value);
      setMatches(results);
    });
  }

  function link(personId: string) {
    if (!roleCode.trim()) return;
    startTransition(async () => {
      const result = await linkPersonToInvestigationAction(investigationId, personId, roleCode.trim());
      if (result.error) toast.error(result.error);
      else {
        setQuery("");
        setMatches([]);
        setRoleCode("");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Input value={query} onChange={(e) => runSearch(e.target.value)} placeholder="Search existing people…" disabled={pending} />
        {matches.length > 0 ? (
          <div className="divide-y divide-border rounded-md border border-border">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{personLabel(m, m.reference)}</p>
                  <p className="text-xs text-muted-foreground">{m.reference}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={roleCode} onChange={(e) => setRoleCode(e.target.value)} placeholder="Role" className="h-8 w-32" disabled={pending} />
                  <Button size="sm" disabled={pending || !roleCode.trim()} onClick={() => link(m.id)}>
                    Link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {people.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No people linked</div>
        ) : (
          people.map((link) => (
            <div key={link.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div>
                <Link href={`/people/${link.person_id}`} className="font-medium text-foreground hover:underline">
                  {personLabel(link.people, link.people?.reference ?? "")}
                </Link>
                <p className="text-xs text-muted-foreground">{link.people?.reference}</p>
              </div>
              <Badge variant="secondary">{link.role_code}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function VehiclesSection({ investigationId, organisationId, vehicles }: { investigationId: string; organisationId: string; vehicles: InvestigationVehicle[] }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<{ id: string; reference: string; registration: string | null; make: string | null; model: string | null }[]>([]);
  const [roleCode, setRoleCode] = useState("");
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    startTransition(async () => {
      const results = await searchVehiclesAction(organisationId, value);
      setMatches(results);
    });
  }

  function link(vehicleId: string) {
    if (!roleCode.trim()) return;
    startTransition(async () => {
      const result = await linkVehicleToInvestigationAction(investigationId, vehicleId, roleCode.trim());
      if (result.error) toast.error(result.error);
      else {
        setQuery("");
        setMatches([]);
        setRoleCode("");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Input value={query} onChange={(e) => runSearch(e.target.value)} placeholder="Search existing vehicles…" disabled={pending} />
        {matches.length > 0 ? (
          <div className="divide-y divide-border rounded-md border border-border">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">{vehicleLabel(m, m.reference)}</p>
                  <p className="text-xs text-muted-foreground">{m.reference}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={roleCode} onChange={(e) => setRoleCode(e.target.value)} placeholder="Role" className="h-8 w-32" disabled={pending} />
                  <Button size="sm" disabled={pending || !roleCode.trim()} onClick={() => link(m.id)}>
                    Link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {vehicles.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No vehicles linked</div>
        ) : (
          vehicles.map((link) => (
            <div key={link.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div>
                <Link href={`/vehicles/${link.vehicle_id}`} className="font-medium text-foreground hover:underline">
                  {vehicleLabel(link.vehicles, link.vehicles?.reference ?? "")}
                </Link>
                <p className="text-xs text-muted-foreground">{link.vehicles?.reference}</p>
              </div>
              <Badge variant="secondary">{link.role_code}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EvidenceSection({ investigationId, organisationId, evidence }: { investigationId: string; organisationId: string; evidence: InvestigationEvidence[] }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<{ id: string; reference: string; description: string; item_type: string }[]>([]);
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    startTransition(async () => {
      setMatches(await searchEvidenceItemsAction(organisationId, value));
    });
  }

  function link(evidenceItemId: string) {
    startTransition(async () => {
      const result = await linkEvidenceToInvestigationAction(investigationId, evidenceItemId);
      if (result.error) toast.error(result.error);
      else {
        setQuery("");
        setMatches([]);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Input value={query} onChange={(e) => runSearch(e.target.value)} placeholder="Search evidence by reference or description…" disabled={pending} />
        {matches.length > 0 ? (
          <div className="divide-y divide-border rounded-md border border-border">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    {m.description} <span className="text-muted-foreground">· {m.item_type}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{m.reference}</p>
                </div>
                <Button size="sm" disabled={pending} onClick={() => link(m.id)}>
                  Link
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {evidence.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No evidence linked</div>
        ) : (
          evidence.map((link) => (
            <div key={link.id} className="px-4 py-2.5 text-sm">
              <p className="font-medium text-foreground">
                {link.evidence_items?.description} <span className="text-muted-foreground">· {link.evidence_items?.item_type}</span>
              </p>
              <p className="text-xs text-muted-foreground">{link.evidence_items?.reference}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotesSection({ investigationId, notes }: { investigationId: string; notes: InvestigationNote[] }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addInvestigationNoteAction(investigationId, body.trim());
      if (result.error) toast.error(result.error);
      else setBody("");
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a note" rows={3} disabled={pending} />
        <Button size="sm" disabled={pending || !body.trim()} onClick={submit}>
          {pending ? "Adding…" : "Add note"}
        </Button>
      </div>
      <div className="space-y-2">
        {notes.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">No notes yet</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="text-foreground">{note.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[note.author?.first_name, note.author?.surname].filter(Boolean).join(" ") || "Unknown"} ·{" "}
                {new Date(note.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
