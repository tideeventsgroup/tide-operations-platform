"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createObservationAction, promoteObservationAction, updateObservationStatusAction } from "@/lib/actions/observations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { listObservations } from "@/lib/domain/observation-service";
import type { Enums, Tables } from "@/lib/supabase/types";

const NO_LOCATION = "__none__";

type Observation = Awaited<ReturnType<typeof listObservations>>[number];
type ObservationStatus = Enums<"observation_status">;

const STATUS_CLASS: Record<ObservationStatus, string> = {
  open: "bg-warning-bg text-warning",
  reviewed: "bg-info-bg text-info",
  promoted: "bg-destructive/10 text-destructive",
  dismissed: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<ObservationStatus, string> = {
  open: "Open",
  reviewed: "Reviewed",
  promoted: "Promoted",
  dismissed: "Dismissed",
};

const SUGGESTED_CATEGORIES = ["Crowd", "Security", "Welfare", "Situational", "Traffic", "Other"];

export function ObservationsPanel({
  operationId,
  observations,
  locations,
  categories,
}: {
  operationId: string;
  observations: Observation[];
  locations: Tables<"operational_locations">[];
  categories: Tables<"event_categories">[];
}) {
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!category.trim() || !summary.trim()) return;
    startTransition(async () => {
      const result = await createObservationAction(operationId, category.trim(), summary.trim(), {
        description: description.trim() || undefined,
        locationId: locationId || undefined,
      });
      if (result.error) toast.error(result.error);
      else {
        setCategory("");
        setSummary("");
        setDescription("");
        setLocationId("");
      }
    });
  }

  const openCount = observations.filter((o) => o.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        <div className="flex gap-2">
          <Input
            list="observation-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Crowd)"
            className="w-48"
            disabled={pending}
          />
          <datalist id="observation-categories">
            {SUGGESTED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Select value={locationId || NO_LOCATION} onValueChange={(v) => setLocationId(v === NO_LOCATION ? "" : (v ?? ""))}>
            <SelectTrigger className="flex-1" disabled={pending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_LOCATION}>No location</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What was observed"
          rows={2}
          disabled={pending}
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Further detail (optional)"
          rows={2}
          disabled={pending}
        />
        <Button size="sm" disabled={pending || !category.trim() || !summary.trim()} onClick={submit}>
          {pending ? "Logging…" : "Log observation"}
        </Button>
      </div>

      <div className="flex items-baseline justify-between">
        <h2 className="section-label">Observations</h2>
        {openCount > 0 ? <span className="text-xs text-muted-foreground">{openCount} open</span> : null}
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {observations.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No observations logged</div>
        ) : (
          observations.map((o) => (
            <ObservationRow key={o.id} operationId={operationId} observation={o} categories={categories} />
          ))
        )}
      </div>
    </div>
  );
}

function ObservationRow({
  operationId,
  observation,
  categories,
}: {
  operationId: string;
  observation: Observation;
  categories: Tables<"event_categories">[];
}) {
  const [promoting, setPromoting] = useState(false);
  const [promoteCategory, setPromoteCategory] = useState(categories[0]?.code ?? "");
  const [pending, startTransition] = useTransition();

  function setStatus(status: ObservationStatus) {
    startTransition(async () => {
      const result = await updateObservationStatusAction(operationId, observation.id, status);
      if (result.error) toast.error(result.error);
    });
  }

  function promote() {
    if (!promoteCategory) return;
    startTransition(async () => {
      const result = await promoteObservationAction(operationId, observation.id, promoteCategory);
      if (result.error) toast.error(result.error);
      else setPromoting(false);
    });
  }

  return (
    <div className="px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">
            {observation.summary} <span className="text-muted-foreground">· {observation.category}</span>
          </p>
          {observation.description ? <p className="mt-1 text-muted-foreground">{observation.description}</p> : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {observation.reference}
            {observation.operational_locations ? ` · ${observation.operational_locations.name}` : ""}
            {observation.promoted_event ? ` · promoted to ${observation.promoted_event.reference}` : ""}
          </p>
        </div>
        <Badge variant="secondary" className={cn("shrink-0 font-medium", STATUS_CLASS[observation.status])}>
          {STATUS_LABEL[observation.status]}
        </Badge>
      </div>

      {observation.status !== "promoted" && observation.status !== "dismissed" ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {observation.status === "open" ? (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("reviewed")}>
              Mark reviewed
            </Button>
          ) : null}
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("dismissed")}>
            Dismiss
          </Button>
          {!promoting ? (
            <Button size="sm" disabled={pending} onClick={() => setPromoting(true)}>
              Promote to event
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Select value={promoteCategory} onValueChange={(v) => setPromoteCategory(v ?? "")}>
                <SelectTrigger size="sm" disabled={pending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={pending} onClick={promote}>
                {pending ? "Promoting…" : "Confirm promotion"}
              </Button>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setPromoting(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
