"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createMethaneMessageAction } from "@/lib/actions/flagship-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { listMethaneVersions } from "@/lib/domain/incident-service";

type MethaneData = Awaited<ReturnType<typeof listMethaneVersions>>;
type Version = MethaneData["versions"][number];

function submitterName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "System";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" });
}

function formattedBlock(v: Version, reference: string) {
  return [
    `M/ETHANE — ${reference} (v${v.version_no})`,
    `M — Major incident declared: ${v.major_incident_declared ? "YES" : "No"}`,
    `E — Exact location: ${v.exact_location}`,
    `T — Type: ${v.incident_type}`,
    `H — Hazards: ${v.hazards || "None reported"}`,
    `A — Access & egress: ${v.access_and_egress || "Not reported"}`,
    `N — Number & type of casualties: ${v.casualties || "None reported"}`,
    `E — Emergency services present/required: ${v.emergency_services || "Not reported"}`,
  ].join("\n");
}

export function MethanePanel({ incidentId, data }: { incidentId: string; data: MethaneData }) {
  const [open, setOpen] = useState(data.versions.length === 0);
  const [majorIncidentDeclared, setMajorIncidentDeclared] = useState(false);
  const [exactLocation, setExactLocation] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [hazards, setHazards] = useState("");
  const [accessAndEgress, setAccessAndEgress] = useState("");
  const [casualties, setCasualties] = useState("");
  const [emergencyServices, setEmergencyServices] = useState("");
  const [pending, startTransition] = useTransition();

  const latest = data.versions[0];

  function submit() {
    if (!exactLocation.trim() || !incidentType.trim()) return;
    startTransition(async () => {
      const result = await createMethaneMessageAction(incidentId, {
        majorIncidentDeclared,
        exactLocation: exactLocation.trim(),
        incidentType: incidentType.trim(),
        hazards: hazards.trim() || undefined,
        accessAndEgress: accessAndEgress.trim() || undefined,
        casualties: casualties.trim() || undefined,
        emergencyServices: emergencyServices.trim() || undefined,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("M/ETHANE recorded");
        setOpen(false);
        setMajorIncidentDeclared(false);
        setExactLocation("");
        setIncidentType("");
        setHazards("");
        setAccessAndEgress("");
        setCasualties("");
        setEmergencyServices("");
      }
    });
  }

  async function copyFormatted(v: Version) {
    if (!data.message) return;
    try {
      await navigator.clipboard.writeText(formattedBlock(v, data.message.reference));
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — clipboard unavailable");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-label">M/ETHANE</h2>
        {!open ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {latest ? "Submit update" : "Submit M/ETHANE"}
          </Button>
        ) : null}
      </div>

      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-3 rounded-lg border border-border bg-card p-4"
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={majorIncidentDeclared}
              onChange={(e) => setMajorIncidentDeclared(e.target.checked)}
              className="size-4"
            />
            Major incident declared
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Exact location</label>
              <Input value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} required disabled={pending} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Type</label>
              <Input value={incidentType} onChange={(e) => setIncidentType(e.target.value)} required disabled={pending} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Hazards</label>
            <Textarea value={hazards} onChange={(e) => setHazards(e.target.value)} rows={2} disabled={pending} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Access &amp; egress</label>
            <Textarea value={accessAndEgress} onChange={(e) => setAccessAndEgress(e.target.value)} rows={2} disabled={pending} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Number &amp; type of casualties</label>
            <Textarea value={casualties} onChange={(e) => setCasualties(e.target.value)} rows={2} disabled={pending} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Emergency services present/required</label>
            <Textarea
              value={emergencyServices}
              onChange={(e) => setEmergencyServices(e.target.value)}
              rows={2}
              disabled={pending}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending || !exactLocation.trim() || !incidentType.trim()}>
              {pending ? "Recording…" : "Record M/ETHANE"}
            </Button>
            {latest ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {data.versions.length === 0 ? (
        !open ? <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">No M/ETHANE message recorded</div> : null
      ) : (
        <div className="space-y-3">
          {data.versions.map((v, i) => (
            <div key={v.id} className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={i === 0 ? "default" : "secondary"} className="font-semibold">
                    v{v.version_no}
                    {i === 0 ? " · Latest" : ""}
                  </Badge>
                  {v.major_incident_declared ? (
                    <Badge className="bg-destructive text-destructive-foreground">Major incident declared</Badge>
                  ) : null}
                </div>
                <Button size="sm" variant="outline" onClick={() => copyFormatted(v)}>
                  Copy formatted
                </Button>
              </div>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Exact location</dt>
                  <dd className="text-foreground">{v.exact_location}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="text-foreground">{v.incident_type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Hazards</dt>
                  <dd className="text-foreground">{v.hazards || "None reported"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Access &amp; egress</dt>
                  <dd className="text-foreground">{v.access_and_egress || "Not reported"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Casualties</dt>
                  <dd className="text-foreground">{v.casualties || "None reported"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Emergency services</dt>
                  <dd className="text-foreground">{v.emergency_services || "Not reported"}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                {submitterName(v.profiles)} · {formatTime(v.submitted_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
