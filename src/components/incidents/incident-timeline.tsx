"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { appendLogEntryAction } from "@/lib/actions/incidents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { listIncidentTimeline } from "@/lib/domain/incident-service";

type Entry = Awaited<ReturnType<typeof listIncidentTimeline>>[number];

const ENTRY_TYPE_LABEL: Record<string, string> = {
  report: "Report",
  update: "Update",
  status: "Status",
  communication: "Comms",
  dispatch: "Dispatch",
  arrival: "Arrival",
  action: "Action",
  decision: "Decision",
  agency: "Agency",
  attachment: "Attachment",
  escalation: "Escalation",
  system: "System",
  correction: "Correction",
};

function authorName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "System";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function IncidentTimeline({ incidentId, entries }: { incidentId: string; entries: Entry[] }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await appendLogEntryAction(incidentId, "update", body.trim());
      if (result.error) toast.error(result.error);
      else setBody("");
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="section-label">Timeline</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add update…"
          className="flex-1"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !body.trim()}>
          {pending ? "Sending…" : "Add"}
        </Button>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {entries.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No entries yet</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex gap-3 px-4 py-2.5 text-sm">
              <div className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{formatTime(entry.occurred_at)}</div>
              <div className="w-20 shrink-0 text-xs font-medium text-muted-foreground uppercase">
                {ENTRY_TYPE_LABEL[entry.entry_type] ?? entry.entry_type}
              </div>
              <div className="min-w-0 flex-1">
                <p className={entry.entry_type === "correction" ? "text-warning" : "text-foreground"}>{entry.body}</p>
                <p className="text-xs text-muted-foreground">{authorName(entry.profiles)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
