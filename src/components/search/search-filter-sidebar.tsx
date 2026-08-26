"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { FILTERABLE_FIELDS, type SearchEntityType } from "@/lib/domain/search-types";

const STATUS_OPTIONS: Partial<Record<SearchEntityType, { value: string; label: string }[]>> = {
  operations: [
    { value: "enquiry", label: "Enquiry" },
    { value: "proposal", label: "Proposal" },
    { value: "confirmed", label: "Confirmed" },
    { value: "planning", label: "Planning" },
    { value: "documentation", label: "Documentation" },
    { value: "client_review", label: "Client Review" },
    { value: "readiness_review", label: "Readiness Review" },
    { value: "operational_ready", label: "Operational Ready" },
    { value: "live", label: "Live" },
    { value: "stand_down", label: "Stand-down" },
    { value: "post_event_review", label: "Post-event Review" },
    { value: "closed", label: "Closed" },
    { value: "archived", label: "Archived" },
  ],
  events: [
    { value: "reported", label: "Reported" },
    { value: "acknowledged", label: "Acknowledged" },
    { value: "active", label: "Active" },
    { value: "monitoring", label: "Monitoring" },
    { value: "awaiting_information", label: "Awaiting Information" },
    { value: "external_agency_lead", label: "External Agency Lead" },
    { value: "suspended", label: "Suspended" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ],
  investigations: [
    { value: "open", label: "Open" },
    { value: "active", label: "Active" },
    { value: "closed", label: "Closed" },
    { value: "archived", label: "Archived" },
  ],
  audits: [
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
  ],
};

export function SearchFilterSidebar({
  type,
  status,
  priority,
  category,
  from,
  to,
  categories,
  priorities,
}: {
  type: SearchEntityType;
  status: string[];
  priority: string[];
  category: string[];
  from: string;
  to: string;
  categories?: { code: string; name: string }[];
  priorities?: { code: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fields = FILTERABLE_FIELDS[type];
  const statusOptions = STATUS_OPTIONS[type];

  function setParam(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (values.length) params.set(key, values.join(","));
    else params.delete(key);
    params.delete("n");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function toggle(key: string, current: string[], value: string) {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setParam(key, next);
  }

  function setDate(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("n");
    router.replace(`${pathname}?${params.toString()}`);
  }

  const hasAnyFilters = fields.status || fields.priority || fields.category || fields.dateColumn;
  if (!hasAnyFilters) return null;

  return (
    <aside className="h-fit space-y-5 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="section-label">Filter by</h2>
        {status.length || priority.length || category.length || from || to ? (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              ["status", "priority", "category", "from", "to", "n"].forEach((k) => params.delete(k));
              router.replace(`${pathname}?${params.toString()}`);
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {fields.dateColumn ? (
        <div className="space-y-2.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
          <p className="section-label">Date range</p>
          <div className="flex flex-col gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setDate("from", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setDate("to", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
            />
          </div>
        </div>
      ) : null}

      {fields.priority && priorities?.length ? (
        <div className="space-y-2.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
          <p className="section-label">Priority</p>
          {priorities.map((p) => (
            <label key={p.code} className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={priority.includes(p.code)} onCheckedChange={() => toggle("priority", priority, p.code)} />
              {p.code} — {p.name}
            </label>
          ))}
        </div>
      ) : null}

      {fields.category && categories?.length ? (
        <div className="space-y-2.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
          <p className="section-label">Category</p>
          {categories.map((c) => (
            <label key={c.code} className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={category.includes(c.code)} onCheckedChange={() => toggle("category", category, c.code)} />
              {c.name}
            </label>
          ))}
        </div>
      ) : null}

      {fields.status && statusOptions ? (
        <div className="space-y-2.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
          <p className="section-label">Status</p>
          {statusOptions.map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={status.includes(s.value)} onCheckedChange={() => toggle("status", status, s.value)} />
              {s.label}
            </label>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
