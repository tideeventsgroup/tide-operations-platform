"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createMethaneMessageAction } from "@/lib/actions/flagship-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { listMethaneVersions } from "@/lib/domain/event-service";

type MethaneData = Awaited<ReturnType<typeof listMethaneVersions>>;
type Version = MethaneData["versions"][number];

function submitterName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "System";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" });
}

type FieldState = "complete" | "empty";

// M-E-T-H-A-N-E as seven individually-scored fields, coloured by whether
// they're actually filled in — real completeness, not a fabricated
// "changed since transmission" flag (this app doesn't track transmission
// state at the field level, so that distinction from the mockup isn't
// something real data can back).
function methaneFields(v: Version): { letter: string; label: string; value: string; state: FieldState }[] {
  return [
    { letter: "M", label: "Major incident declared", value: v.major_incident_declared ? "Yes — declared." : "Not declared.", state: "complete" },
    { letter: "E", label: "Exact location", value: v.exact_location, state: v.exact_location ? "complete" : "empty" },
    { letter: "T", label: "Type of incident", value: v.incident_type, state: v.incident_type ? "complete" : "empty" },
    { letter: "H", label: "Hazards", value: v.hazards ?? "", state: v.hazards ? "complete" : "empty" },
    { letter: "A", label: "Access & egress", value: v.access_and_egress ?? "", state: v.access_and_egress ? "complete" : "empty" },
    { letter: "N", label: "Number & type of casualties", value: v.casualties ?? "", state: v.casualties ? "complete" : "empty" },
    { letter: "E", label: "Emergency services present/required", value: v.emergency_services ?? "", state: v.emergency_services ? "complete" : "empty" },
  ];
}

function formattedBlock(v: Version, reference: string) {
  return [
    `METHANE — ${reference} (v${v.version_no})`,
    `M — Major incident declared: ${v.major_incident_declared ? "YES" : "No"}`,
    `E — Exact location: ${v.exact_location}`,
    `T — Type: ${v.incident_type}`,
    `H — Hazards: ${v.hazards || "None reported"}`,
    `A — Access & egress: ${v.access_and_egress || "Not reported"}`,
    `N — Number & type of casualties: ${v.casualties || "None reported"}`,
    `E — Emergency services present/required: ${v.emergency_services || "Not reported"}`,
  ].join("\n");
}

export function MethanePanel({ eventId, data }: { eventId: string; data: MethaneData }) {
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
      const result = await createMethaneMessageAction(eventId, {
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
        toast.success("METHANE recorded");
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
        <h2 className="section-label">METHANE</h2>
        {!open ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {latest ? "Submit update" : "Submit METHANE"}
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
              {pending ? "Recording…" : "Record METHANE"}
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
        !open ? <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">No METHANE message recorded</div> : null
      ) : (
        <div className="space-y-4">
          {(() => {
            const latest = data.versions[0];
            const fields = methaneFields(latest);
            const completeCount = fields.filter((f) => f.state === "complete").length;
            const pct = Math.round((completeCount / fields.length) * 100);
            return (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Version {latest.version_no} · {submitterName(latest.profiles)} · {formatTime(latest.submitted_at)}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copyFormatted(latest)}>
                    Copy formatted
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {fields.map((f, i) => (
                    <div
                      key={i}
                      className="rounded-md border p-3.5"
                      style={{
                        borderLeftWidth: 3,
                        borderLeftColor: f.state === "complete" ? "var(--priority-resolved)" : "var(--border)",
                        borderStyle: f.state === "complete" ? "solid" : "dashed",
                      }}
                    >
                      <div className="mb-1.5 flex items-baseline gap-2.5">
                        <span className="w-4 shrink-0 font-mono text-[15px] font-bold" style={{ color: "var(--priority-p1)" }}>
                          {f.letter}
                        </span>
                        <span className={cn("flex-1 text-[13px] font-semibold", f.state === "complete" ? "text-foreground" : "text-muted-foreground")}>
                          {f.label}
                        </span>
                        {f.state === "empty" ? (
                          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.05em] text-muted-foreground uppercase">
                            Not yet completed
                          </span>
                        ) : null}
                      </div>
                      <p className={cn("pl-[26px] text-[13.5px] leading-relaxed", f.state === "complete" ? "text-foreground" : "text-muted-foreground")}>
                        {f.state === "complete" ? f.value : "Required before this report can be marked complete."}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3.5">
                  <div className="flex-1">
                    <div className="mb-1.5 text-[12.5px] font-semibold text-foreground">
                      {completeCount} of {fields.length} fields complete
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--priority-p1)" }} />
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {data.versions.length > 1 ? (
            <div className="space-y-2">
              <h3 className="section-label">Earlier versions</h3>
              {data.versions.slice(1).map((v) => (
                <div key={v.id} className="space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="font-semibold">
                      v{v.version_no}
                    </Badge>
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
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    {submitterName(v.profiles)} · {formatTime(v.submitted_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
