"use client";

import { useActionState, useState } from "react";
import { createIncidentAction } from "@/lib/actions/incidents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Tables } from "@/lib/supabase/types";

export function RapidIncidentForm({
  eventId,
  categories,
  priorities,
  locations,
}: {
  eventId: string;
  categories: Tables<"incident_categories">[];
  priorities: Tables<"incident_priorities">[];
  locations: Tables<"operational_locations">[];
}) {
  const [state, action, pending] = useActionState(createIncidentAction, undefined);
  const [showMore, setShowMore] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="event_id" value={eventId} />

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="category_code">
          Category
        </label>
        <select
          id="category_code"
          name="category_code"
          required
          autoFocus
          className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base"
        >
          {categories.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="location_id">
          Location
        </label>
        <select
          id="location_id"
          name="location_id"
          className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base"
        >
          <option value="">Not specified</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="summary">
          What&apos;s happening
        </label>
        <Textarea id="summary" name="summary" required rows={3} className="text-base" placeholder="Brief, factual description" />
      </div>

      {showMore ? (
        <div className="space-y-4 border-t border-border pt-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground" htmlFor="priority_code">
              Priority (optional — controller can set this)
            </label>
            <select
              id="priority_code"
              name="priority_code"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Not set</option>
              {priorities.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground" htmlFor="report_source">
              Source
            </label>
            <select
              id="report_source"
              name="report_source"
              defaultValue="in_person"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="radio">Radio</option>
              <option value="telephone">Telephone</option>
              <option value="in_person">In Person</option>
              <option value="field_app">Field App</option>
              <option value="event_control_observation">Event Control Observation</option>
              <option value="client">Client</option>
              <option value="contractor">Contractor</option>
              <option value="emergency_service">Emergency Service</option>
              <option value="public">Public</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Add priority / source
        </button>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-destructive text-base font-semibold text-destructive-foreground hover:bg-destructive/90"
      >
        {pending ? "Reporting…" : "Report Incident"}
      </Button>
    </form>
  );
}
