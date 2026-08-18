"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { addPendingIncident } from "@/lib/offline/db";
import { refreshPendingCount } from "@/lib/offline/pending-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Enums, Tables } from "@/lib/supabase/types";

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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    const record = {
      localId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      event_id: eventId,
      category_code: String(formData.get("category_code") ?? ""),
      summary: String(formData.get("summary") ?? "").trim(),
      location_id: (formData.get("location_id") as string) || undefined,
      priority_code: (formData.get("priority_code") as string) || undefined,
      report_source: (formData.get("report_source") as string) || undefined,
    };

    if (!record.category_code || !record.summary) {
      setError("Select a category and enter a brief description.");
      return;
    }

    startTransition(async () => {
      if (!navigator.onLine) {
        await addPendingIncident(record);
        await refreshPendingCount();
        toast.success("Saved offline — will sync automatically when signal returns");
        router.push(`/events/${eventId}/incidents`);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc("create_incident", {
          p_event_id: record.event_id,
          p_category_code: record.category_code,
          p_summary: record.summary,
          p_location_id: record.location_id,
          p_priority_code: record.priority_code,
          p_report_source: record.report_source as Enums<"report_source"> | undefined,
        });

        if (rpcError) {
          if (!("code" in rpcError) || !rpcError.code) {
            await addPendingIncident(record);
            await refreshPendingCount();
            toast.success("Saved offline — will sync automatically when signal returns");
            router.push(`/events/${eventId}/incidents`);
            return;
          }
          setError(rpcError.message);
          return;
        }

        router.push(`/incidents/${data}`);
      } catch {
        await addPendingIncident(record);
        await refreshPendingCount();
        toast.success("Saved offline — will sync automatically when signal returns");
        router.push(`/events/${eventId}/incidents`);
      }
    });
  }

  return (
    <form action={submit} className="space-y-5" noValidate>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
