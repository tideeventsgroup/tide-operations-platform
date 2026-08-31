"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Mic, MoreHorizontal, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addPendingIncident } from "@/lib/offline/db";
import { refreshPendingCount } from "@/lib/offline/pending-store";
import { logEvidenceItemAction } from "@/lib/actions/evidence";
import { priorityColor } from "@/lib/priority-colors";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Enums, Tables } from "@/lib/supabase/types";

type OperationOption = Pick<Tables<"operations">, "id" | "name" | "reference" | "organisation_id">;
type EventCategory = Tables<"event_categories">;
type EventPriority = Tables<"event_priorities">;
type Location = Tables<"operational_locations">;

const NOT_SPECIFIED = "__not_specified__";

// One screen, one thumb: category and priority are single-tap tiles (never
// pickers), location defaults from GPS with three quick chips behind it,
// and the footer state tells you honestly whether this is about to submit
// or queue — a steward holding a radio has one hand free, at most.
export function MobileReportEventForm({
  operation,
  categories,
  priorities,
  locations,
  categoryIcon,
}: {
  operation: OperationOption;
  categories: EventCategory[];
  priorities: EventPriority[];
  locations: Location[];
  categoryIcon: Record<string, LucideIcon>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [categoryCode, setCategoryCode] = useState("");
  const [priorityCode, setPriorityCode] = useState("");
  const [locationId, setLocationId] = useState("");
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [summary, setSummary] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const quickLocations = useMemo(() => locations.slice(0, 3), [locations]);
  const selectedLocation = locations.find((l) => l.id === locationId);
  const valid = Boolean(categoryCode && summary.trim());

  function submit() {
    if (!valid) return;
    setError(null);
    const record = {
      localId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      operation_id: operation.id,
      category_code: categoryCode,
      summary: summary.trim(),
      location_id: locationId || undefined,
      priority_code: priorityCode || undefined,
      report_source: "field_app" as Enums<"report_source">,
    };

    startTransition(async () => {
      if (!navigator.onLine) {
        await addPendingIncident(record);
        await refreshPendingCount();
        toast.success("Saved offline — will sync automatically when signal returns");
        router.push(`/operations/${operation.id}/events`);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc("create_event", {
          p_operation_id: record.operation_id,
          p_category_code: record.category_code,
          p_summary: record.summary,
          p_location_id: record.location_id,
          p_priority_code: record.priority_code,
          p_report_source: record.report_source,
        });

        if (rpcError) {
          if (!("code" in rpcError) || !rpcError.code) {
            await addPendingIncident(record);
            await refreshPendingCount();
            toast.success("Saved offline — will sync automatically when signal returns");
            router.push(`/operations/${operation.id}/events`);
            return;
          }
          setError(rpcError.message);
          return;
        }

        if (photo) {
          const fd = new FormData();
          fd.set("file", photo);
          await logEvidenceItemAction(data, operation.id, "Photo", "Attached from mobile field report", {}, fd);
        }
        if (voice) {
          const fd = new FormData();
          fd.set("file", voice);
          await logEvidenceItemAction(data, operation.id, "Voice note", "Attached from mobile field report", {}, fd);
        }

        router.push(`/events/${data}`);
      } catch {
        await addPendingIncident(record);
        await refreshPendingCount();
        toast.success("Saved offline — will sync automatically when signal returns");
        router.push(`/operations/${operation.id}/events`);
      }
    });
  }

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <div>
        <div className="section-label mb-2.5">1 · Category</div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => {
            const Icon = categoryIcon[c.code] ?? MoreHorizontal;
            const selected = categoryCode === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setCategoryCode(c.code)}
                className={cn(
                  "flex h-14 items-center gap-2.5 rounded-lg border px-3.5 text-left text-[14.5px] font-medium transition-colors",
                  selected ? "border-transparent bg-foreground text-background" : "border-input bg-card text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {priorities.length > 0 ? (
        <div>
          <div className="section-label mb-2.5">2 · Priority</div>
          <div className="flex gap-2">
            {priorities.map((p) => {
              const selected = priorityCode === p.code;
              const color = priorityColor(p.code);
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setPriorityCode(selected ? "" : p.code)}
                  style={selected ? { background: color, borderColor: color } : undefined}
                  className={cn(
                    "flex h-13 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border",
                    selected ? "text-white" : "border-input bg-card",
                  )}
                >
                  <span className="font-mono text-[15px] font-bold" style={!selected ? { color } : undefined}>
                    {p.code}
                  </span>
                  <span className={cn("font-mono text-[9.5px] uppercase", selected ? "text-white/85" : "text-muted-foreground")}>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div>
        <div className="section-label mb-2.5">3 · Location</div>
        <button
          type="button"
          onClick={() => setLocationExpanded((v) => !v)}
          className="mb-2 flex h-14 w-full items-center gap-3 rounded-lg border border-input bg-card px-3.5 text-left"
        >
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: "var(--priority-resolved)" }} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-medium text-foreground">{selectedLocation?.name ?? "Not specified"}</span>
            <span className="block font-mono text-[10.5px] text-muted-foreground">
              {coords ? `GPS · ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "GPS unavailable — pick a location"}
            </span>
          </span>
          <span className="shrink-0 text-[12.5px] font-medium text-primary">Change</span>
        </button>
        {locationExpanded ? (
          <Select
            value={locationId || NOT_SPECIFIED}
            onValueChange={(v) => {
              setLocationId(v === NOT_SPECIFIED ? "" : (v ?? ""));
              setLocationExpanded(false);
            }}
          >
            <SelectTrigger className="mb-2 h-11 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NOT_SPECIFIED}>Not specified</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex flex-wrap gap-2">
            {quickLocations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setLocationId(loc.id)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[12.5px] font-medium",
                  locationId === loc.id ? "border-transparent bg-foreground text-background" : "border-input bg-card text-foreground",
                )}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="section-label mb-2.5">4 · What happened</div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="Brief, factual description"
          className="w-full rounded-lg border border-input bg-card px-3.5 py-3 text-[14.5px] text-foreground"
        />
        <div className="mt-2 flex gap-2">
          <label className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-card text-[13.5px] font-medium text-foreground">
            <Camera className="size-4" />
            {photo ? "Photo attached" : "Photo"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input bg-card text-[13.5px] font-medium text-foreground">
            <Mic className="size-4" />
            {voice ? "Voice attached" : "Voice note"}
            <input type="file" accept="audio/*" capture className="hidden" onChange={(e) => setVoice(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-2">
        <button
          type="button"
          disabled={!valid || pending}
          onClick={submit}
          className="flex h-14 w-full items-center justify-center rounded-lg bg-primary text-[15.5px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit to Control"}
        </button>
        <p className="flex items-center justify-center gap-1.5 font-mono text-[11.5px] text-muted-foreground">
          <span className="size-1.5 rounded-full" style={{ background: online ? "var(--priority-resolved)" : "var(--priority-p2)" }} />
          {online ? "ONLINE · SUBMITS IMMEDIATELY" : "QUEUED · SENDS WHEN BACK ON"}
        </p>
      </div>
    </div>
  );
}
