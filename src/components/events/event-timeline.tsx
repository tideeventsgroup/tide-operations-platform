"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { appendLogEntryAction } from "@/lib/actions/events";
import { logEvidenceItemAction } from "@/lib/actions/evidence";
import { cn } from "@/lib/utils";
import type { Enums } from "@/lib/supabase/types";
import type { listEventTimeline } from "@/lib/domain/event-service";

type Entry = Awaited<ReturnType<typeof listEventTimeline>>[number];
type EntryType = Enums<"event_log_entry_type">;

const ENTRY_TYPE_LABEL: Record<string, string> = {
  report: "Report",
  update: "Update",
  status: "Status",
  communication: "Radio",
  dispatch: "Dispatch",
  arrival: "Arrival",
  action: "Action",
  decision: "Decision",
  agency: "Agency",
  attachment: "Attachment",
  escalation: "Escalation",
  system: "System",
  correction: "Correction",
  opened: "Opened",
};

// The four quick-type buttons the mockup shows on the composer — the rest
// of event_log_entry_type is still reachable (system/escalation entries
// come from elsewhere), these four are just what a human types by hand.
const QUICK_TYPES: { type: EntryType; label: string }[] = [
  { type: "update", label: "Update" },
  { type: "communication", label: "Radio message" },
  { type: "decision", label: "Decision" },
];

function authorName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "System";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const DOT_COLOR: Record<string, string> = {
  decision: "var(--priority-p2)",
  communication: "var(--muted-foreground)",
  attachment: "var(--muted-foreground)",
  update: "var(--muted-foreground)",
  opened: "var(--foreground)",
  system: "var(--border)",
};

export function EventTimeline({ eventId, operationId, entries }: { eventId: string; operationId: string; entries: Entry[] }) {
  const [body, setBody] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("update");
  const [attachMode, setAttachMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (attachMode) {
      if (!file) return;
      startTransition(async () => {
        const fd = new FormData();
        fd.set("file", file);
        const result = await logEvidenceItemAction(eventId, operationId, "Photo", body.trim() || "Attached from timeline", {}, fd);
        if (result.error) toast.error(result.error);
        else {
          setBody("");
          setFile(null);
          setAttachMode(false);
        }
      });
      return;
    }
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await appendLogEntryAction(eventId, entryType, body.trim());
      if (result.error) toast.error(result.error);
      else {
        setBody("");
        setEntryType("update");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Timeline · {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10.5px] font-semibold text-primary-foreground">
            {"·"}
          </div>
          <div className="min-w-0 flex-1">
            {attachMode ? (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={pending}
                className="mb-2.5 w-full text-sm text-muted-foreground file:mr-2 file:rounded-md file:border file:border-input file:bg-transparent file:px-2 file:py-1 file:text-sm"
              />
            ) : null}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={attachMode ? "Caption (optional)…" : "Add a timeline entry…"}
              rows={2}
              disabled={pending}
              className="mb-2.5 w-full resize-none rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_TYPES.map((q) => (
                <button
                  key={q.type}
                  type="button"
                  onClick={() => {
                    setAttachMode(false);
                    setEntryType(q.type);
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium",
                    !attachMode && entryType === q.type ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
                  )}
                >
                  {q.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAttachMode((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium",
                  attachMode ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
                )}
              >
                <Camera className="size-3.5" />
                Attach
              </button>
              <button
                type="button"
                disabled={pending || (attachMode ? !file : !body.trim())}
                onClick={submit}
                className="ml-auto rounded-md bg-primary px-3.5 py-1.5 text-[11.5px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                {pending ? "Adding…" : "Add entry"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">No entries yet</div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute top-1.5 bottom-1.5 left-[7px] w-0.5 bg-border" />
          {[...entries].reverse().map((entry, i) => (
            <div key={entry.id} className={cn("relative", i < entries.length - 1 ? "mb-3.5" : undefined)}>
              <div
                className="absolute top-1 -left-6.5 flex size-4 items-center justify-center rounded-full border-2 bg-card"
                style={{ borderColor: i === 0 ? (DOT_COLOR[entry.entry_type] ?? "var(--border)") : "var(--border)" }}
              >
                {i === 0 ? <span className="size-1.5 rounded-full" style={{ background: DOT_COLOR[entry.entry_type] ?? "var(--border)" }} /> : null}
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono text-xs font-semibold text-foreground">{formatTime(entry.occurred_at)}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-muted-foreground uppercase">
                    {ENTRY_TYPE_LABEL[entry.entry_type] ?? entry.entry_type}
                  </span>
                  <span className="text-[12.5px] font-medium text-muted-foreground">{authorName(entry.profiles)}</span>
                </div>
                {entry.body ? (
                  <p className={cn("text-sm leading-relaxed", entry.entry_type === "correction" ? "text-warning" : "text-foreground")}>
                    {entry.body}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
