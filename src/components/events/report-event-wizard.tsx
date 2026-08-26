"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Accessibility,
  AlertTriangle,
  Building2,
  Bus,
  CheckIcon,
  CloudRain,
  Eye,
  Flame,
  HardHat,
  Handshake,
  HeartHandshake,
  HeartPulse,
  Leaf,
  type LucideIcon,
  MoreHorizontal,
  PackageSearch,
  PackageX,
  Radio,
  Settings2,
  Shield,
  ShieldCheck,
  TrafficCone,
  UserSearch,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addPendingIncident } from "@/lib/offline/db";
import { refreshPendingCount } from "@/lib/offline/pending-store";
import { getEventFormContextAction } from "@/lib/actions/operations";
import { setEventClassificationAction, setEventRestrictedNarrativeAction } from "@/lib/actions/event-classification";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EventTypeTile } from "@/components/ui/event-type-tile";
import { cn } from "@/lib/utils";
import type { Enums, Tables } from "@/lib/supabase/types";

type OperationOption = Pick<Tables<"operations">, "id" | "name" | "reference" | "organisation_id">;
type EventCategory = Tables<"event_categories">;
type EventPriority = Tables<"event_priorities">;
type Location = Tables<"operational_locations">;

const CATEGORY_GROUPS: { label: string; codes: string[] }[] = [
  {
    label: "Safety & medical",
    codes: ["medical", "fire", "welfare", "safeguarding", "missing_child", "vulnerable_person", "accessibility"],
  },
  {
    label: "Security & crowd",
    codes: ["security", "crowd", "public_disorder", "suspicious_activity", "suspicious_item", "contractor"],
  },
  {
    label: "Operational",
    codes: ["weather", "traffic", "transport", "infrastructure", "utilities", "communications", "operational", "environmental", "noise"],
  },
  {
    label: "Other",
    codes: ["lost_property", "other"],
  },
];

const CATEGORY_ICON: Record<string, LucideIcon> = {
  medical: HeartPulse,
  security: Shield,
  crowd: Users,
  safeguarding: ShieldCheck,
  missing_child: UserSearch,
  vulnerable_person: HeartHandshake,
  fire: Flame,
  weather: CloudRain,
  traffic: TrafficCone,
  transport: Bus,
  infrastructure: Building2,
  utilities: Zap,
  communications: Radio,
  lost_property: PackageSearch,
  public_disorder: AlertTriangle,
  suspicious_activity: Eye,
  suspicious_item: PackageX,
  contractor: HardHat,
  accessibility: Accessibility,
  welfare: Handshake,
  noise: Volume2,
  environmental: Leaf,
  operational: Settings2,
  other: MoreHorizontal,
};

const CATEGORY_DESCRIPTION: Record<string, string> = {
  medical: "Injury, illness, or a request for medical attention",
  security: "Security incident requiring an immediate response",
  crowd: "Crowd density, crush risk, or crowd behaviour",
  safeguarding: "A safeguarding concern involving a person at risk",
  missing_child: "A child reported missing or separated from their group",
  vulnerable_person: "A vulnerable person requiring welfare support",
  fire: "Fire, smoke, or a fire-safety concern",
  weather: "Weather conditions affecting the event",
  traffic: "Traffic disruption on or around site",
  transport: "An issue with event transport or shuttle services",
  infrastructure: "A structural or infrastructure fault",
  utilities: "Power, water, or utilities failure",
  communications: "A communications or radio network issue",
  lost_property: "An item reported lost or found",
  public_disorder: "Disorderly or aggressive behaviour",
  suspicious_activity: "Activity that appears suspicious or out of place",
  suspicious_item: "An unattended or suspicious item",
  contractor: "An issue involving a contractor or supplier",
  accessibility: "An accessibility concern or access request",
  welfare: "A general welfare concern",
  noise: "A noise complaint or breach",
  environmental: "An environmental hazard or spillage",
  operational: "A general operational matter",
  other: "Anything that doesn't fit another category",
};

const REPORT_SOURCES: { value: Enums<"report_source">; label: string }[] = [
  { value: "radio", label: "Radio" },
  { value: "telephone", label: "Telephone" },
  { value: "in_person", label: "In Person" },
  { value: "field_app", label: "Field App" },
  { value: "event_control_observation", label: "Event Control Observation" },
  { value: "client", label: "Client" },
  { value: "contractor", label: "Contractor" },
  { value: "emergency_service", label: "Emergency Service" },
  { value: "public", label: "Public" },
  { value: "other", label: "Other" },
];

const CLASSIFICATIONS: { value: Enums<"classification_level">; label: string }[] = [
  { value: "internal", label: "Standard" },
  { value: "confidential", label: "Restricted" },
  { value: "restricted", label: "Highly Restricted" },
];

type StepKey = "operation" | "type" | "details" | "additional" | "restricted" | "reporting";

const STEP_LABEL: Record<StepKey, string> = {
  operation: "Select operation",
  type: "Select event type",
  details: "Event details",
  additional: "Additional information",
  restricted: "Restrict access to this event",
  reporting: "Reporting details",
};

export function ReportEventWizard({
  operations,
  categories,
  initialOperation,
  initialPriorities,
  initialLocations,
  initialCanViewRestricted,
}: {
  operations: OperationOption[];
  categories: EventCategory[];
  initialOperation?: OperationOption;
  initialPriorities?: EventPriority[];
  initialLocations?: Location[];
  initialCanViewRestricted?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingOperation, setLoadingOperation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [operation, setOperation] = useState<OperationOption | undefined>(initialOperation);
  const [priorities, setPriorities] = useState<EventPriority[]>(initialPriorities ?? []);
  const [locations, setLocations] = useState<Location[]>(initialLocations ?? []);
  const [canViewRestricted, setCanViewRestricted] = useState(initialCanViewRestricted ?? false);
  const [operationQuery, setOperationQuery] = useState("");

  const [categoryCode, setCategoryCode] = useState("");
  const [locationId, setLocationId] = useState("");
  const [summary, setSummary] = useState("");
  const [priorityCode, setPriorityCode] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [classification, setClassification] = useState<Enums<"classification_level">>("confidential");
  const [narrativeBody, setNarrativeBody] = useState("");
  const [reportSource, setReportSource] = useState<Enums<"report_source">>("in_person");

  const stepKeys = useMemo<StepKey[]>(() => {
    const keys: StepKey[] = [];
    if (!initialOperation) keys.push("operation");
    keys.push("type", "details", "additional");
    if (canViewRestricted) keys.push("restricted");
    keys.push("reporting");
    return keys;
  }, [initialOperation, canViewRestricted]);

  const [stepIndex, setStepIndex] = useState(0);
  const step = stepKeys[stepIndex];

  const categoriesByCode = useMemo(() => new Map(categories.map((c) => [c.code, c])), [categories]);
  const filteredOperations = useMemo(() => {
    const term = operationQuery.trim().toLowerCase();
    if (!term) return operations;
    return operations.filter((o) => o.name.toLowerCase().includes(term) || o.reference.toLowerCase().includes(term));
  }, [operations, operationQuery]);

  const stepValid: Record<StepKey, boolean> = {
    operation: Boolean(operation),
    type: Boolean(categoryCode),
    details: summary.trim().length > 0,
    additional: true,
    restricted: true,
    reporting: true,
  };

  function goNext() {
    if (!stepValid[step]) return;
    setStepIndex((i) => Math.min(i + 1, stepKeys.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function selectOperation(op: OperationOption) {
    setOperation(op);
    setLoadingOperation(true);
    setError(null);
    try {
      const context = await getEventFormContextAction(op.id);
      setPriorities(context.priorities);
      setLocations(context.locations);
      setCanViewRestricted(context.canViewRestricted);
      setStepIndex((i) => Math.min(i + 1, stepKeys.length - 1));
    } catch {
      setError("Couldn't load that operation. Try again.");
    } finally {
      setLoadingOperation(false);
    }
  }

  function submit() {
    if (!operation) return;
    setError(null);
    const record = {
      localId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      operation_id: operation.id,
      category_code: categoryCode,
      summary: summary.trim(),
      location_id: locationId || undefined,
      priority_code: priorityCode || undefined,
      report_source: reportSource || undefined,
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
          p_report_source: record.report_source as Enums<"report_source"> | undefined,
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

        if (restricted && narrativeBody.trim()) {
          await setEventClassificationAction(data, classification);
          await setEventRestrictedNarrativeAction(data, narrativeBody.trim());
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
      <div className="space-y-5 rounded-lg border border-border bg-card p-5">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === "operation" ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Select operation</h2>
            <p className="text-sm text-muted-foreground">Which operation is this event happening at?</p>
            <input
              value={operationQuery}
              onChange={(e) => setOperationQuery(e.target.value)}
              placeholder="Search operations…"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
            <div className="max-h-96 divide-y divide-border overflow-y-auto rounded-md border border-border">
              {filteredOperations.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No operations found</p>
              ) : (
                filteredOperations.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    disabled={loadingOperation}
                    onClick={() => selectOperation(op)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <span>
                      <span className="block font-medium text-foreground">{op.name}</span>
                      <span className="block text-xs text-muted-foreground">{op.reference}</span>
                    </span>
                    {loadingOperation && operation?.id === op.id ? (
                      <span className="text-xs text-muted-foreground">Loading…</span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}

        {step === "type" ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Select event type</h2>
              <p className="text-sm text-muted-foreground">Choose the category that best describes what&apos;s happening.</p>
            </div>
            {CATEGORY_GROUPS.map((group) => {
              const groupCategories = group.codes.map((code) => categoriesByCode.get(code)).filter((c): c is EventCategory => Boolean(c));
              if (groupCategories.length === 0) return null;
              return (
                <div key={group.label} className="space-y-2">
                  <div className="section-label">{group.label}</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {groupCategories.map((c) => (
                      <EventTypeTile
                        key={c.code}
                        icon={CATEGORY_ICON[c.code] ?? MoreHorizontal}
                        label={c.name}
                        description={CATEGORY_DESCRIPTION[c.code]}
                        selected={categoryCode === c.code}
                        onClick={() => setCategoryCode(c.code)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {step === "details" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Event details</h2>
              <p className="text-sm text-muted-foreground">Where is it happening, and what&apos;s going on?</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="location_id">
                Location
              </label>
              <select
                id="location_id"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
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
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="text-base"
                placeholder="Brief, factual description"
                autoFocus
              />
            </div>
          </div>
        ) : null}

        {step === "additional" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Additional information</h2>
              <p className="text-sm text-muted-foreground">Optional — the controller can set or change this later.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="priority_code">
                Priority
              </label>
              <select
                id="priority_code"
                value={priorityCode}
                onChange={(e) => setPriorityCode(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base"
              >
                <option value="">Not set</option>
                {priorities.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {step === "restricted" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Restrict access to this event</h2>
              <p className="text-sm text-muted-foreground">
                Raising this event&apos;s classification never hides it, its category, location, status, or priority — only the
                detail recorded below is restricted.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={restricted}
                onChange={(e) => setRestricted(e.target.checked)}
                className="size-4 rounded border-input"
              />
              Restrict access to this event
            </label>
            {restricted ? (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Classification</label>
                  <div className="flex flex-wrap gap-2">
                    {CLASSIFICATIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setClassification(c.value)}
                        aria-pressed={classification === c.value}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                          classification === c.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/40",
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground" htmlFor="narrative_body">
                    Restricted narrative
                  </label>
                  <Textarea
                    id="narrative_body"
                    value={narrativeBody}
                    onChange={(e) => setNarrativeBody(e.target.value)}
                    rows={4}
                    placeholder="Only visible to those with restricted-access permission"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "reporting" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Reporting details</h2>
              <p className="text-sm text-muted-foreground">How was this reported, and does everything below look right?</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="report_source">
                Source
              </label>
              <select
                id="report_source"
                value={reportSource}
                onChange={(e) => setReportSource(e.target.value as Enums<"report_source">)}
                className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-base"
              >
                {REPORT_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Operation</span>
                <span className="font-medium text-foreground">{operation?.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">{categoriesByCode.get(categoryCode)?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-foreground">{locations.find((l) => l.id === locationId)?.name ?? "Not specified"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium text-foreground">{priorityCode || "Not set"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Restricted</span>
                <span className="font-medium text-foreground">{restricted && narrativeBody.trim() ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={stepIndex === 0 || pending} onClick={goBack}>
            Back
          </Button>
          {step === "reporting" ? (
            <Button
              type="button"
              disabled={pending || !categoryCode || !summary.trim() || !operation}
              onClick={submit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "Reporting…" : "Report event"}
            </Button>
          ) : (
            <Button type="button" disabled={!stepValid[step] || loadingOperation} onClick={goNext}>
              Continue
            </Button>
          )}
        </div>
      </div>

      <aside className="hidden lg:block">
        <ol className="space-y-1">
          {stepKeys.map((key, i) => {
            const isCurrent = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
                  isCurrent ? "bg-accent font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    isDone ? "bg-primary text-primary-foreground" : isCurrent ? "border-2 border-primary text-primary" : "border border-border",
                  )}
                >
                  {isDone ? <CheckIcon className="size-3" /> : i + 1}
                </span>
                {STEP_LABEL[key]}
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
