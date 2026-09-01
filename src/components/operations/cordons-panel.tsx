"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { closeCordonAction, establishCordonAction } from "@/lib/actions/cordons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Enums } from "@/lib/supabase/types";
import type { listOperationCordons } from "@/lib/domain/operation-service";

type Cordon = Awaited<ReturnType<typeof listOperationCordons>>[number];
type CordonType = Enums<"cordon_type">;

const TYPE_LABEL: Record<CordonType, string> = {
  inner_cordon: "Inner cordon",
  outer_cordon: "Outer cordon",
  rendezvous_point: "Rendezvous point (RVP)",
  casualty_clearing_station: "Casualty clearing station (CCS)",
};

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "Unknown";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export function CordonsPanel({ operationId, cordons }: { operationId: string; cordons: Cordon[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CordonType>("inner_cordon");
  const [label, setLabel] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [what3words, setWhat3words] = useState("");
  const [pending, startTransition] = useTransition();

  const active = cordons.filter((c) => !c.closed_at);
  const closed = cordons.filter((c) => c.closed_at);

  function reset() {
    setOpen(false);
    setLabel("");
    setLocationDescription("");
    setWhat3words("");
    setType("inner_cordon");
  }

  function submit() {
    if (!label.trim()) return;
    startTransition(async () => {
      const result = await establishCordonAction(operationId, {
        type,
        label: label.trim(),
        locationDescription: locationDescription.trim() || undefined,
        what3words: what3words.trim() || undefined,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Established");
        reset();
      }
    });
  }

  function close(cordonId: string) {
    startTransition(async () => {
      const result = await closeCordonAction(cordonId, operationId);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-label">Cordons &amp; control points ({active.length} active)</h2>
        {!open ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Establish
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={reset}>
            Cancel
          </Button>
        )}
      </div>

      {open ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType((v ?? "inner_cordon") as CordonType)}>
                <SelectTrigger className="w-full" disabled={pending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_LABEL) as [CordonType, string][]).map(([value, l]) => (
                    <SelectItem key={value} value={value}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cordon-label">Label</Label>
              <Input
                id="cordon-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Gate C service road"
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cordon-location">Location description</Label>
              <Input id="cordon-location" value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cordon-w3w">what3words</Label>
              <Input
                id="cordon-w3w"
                value={what3words}
                onChange={(e) => setWhat3words(e.target.value)}
                placeholder="///covert.sandbar.ripen"
                className="font-mono"
                disabled={pending}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={pending || !label.trim()} onClick={submit}>
              {pending ? "Establishing…" : "Establish"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {active.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No active cordons or control points</div>
        ) : (
          active.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-muted-foreground uppercase">
                    {TYPE_LABEL[c.type]}
                  </span>
                  {c.events ? <span className="font-mono text-[11px] text-primary">{c.events.reference}</span> : null}
                </div>
                <p className="mt-1 font-medium text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground">
                  {[c.location_description, c.what3words ? `///${c.what3words.replace(/^\/+/, "")}` : null].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Established by {personName(c.established_by_profile)} · {new Date(c.established_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => close(c.id)}>
                Close
              </Button>
            </div>
          ))
        )}
      </div>

      {closed.length > 0 ? (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer select-none">Closed ({closed.length})</summary>
          <div className="mt-2 divide-y divide-border rounded-lg border border-border bg-card">
            {closed.map((c) => (
              <div key={c.id} className="px-4 py-2 text-sm">
                <span className="font-medium text-foreground">{TYPE_LABEL[c.type]}</span>
                <span className="text-muted-foreground"> · {c.label}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
