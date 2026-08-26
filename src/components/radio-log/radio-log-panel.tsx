"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { logRadioEntryAction } from "@/lib/actions/radio-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { listRadioLogEntries } from "@/lib/domain/radio-log-service";

type RadioLogEntry = Awaited<ReturnType<typeof listRadioLogEntries>>[number];

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function RadioLogPanel({ operationId, entries }: { operationId: string; entries: RadioLogEntry[] }) {
  const [channel, setChannel] = useState("");
  const [fromCallsign, setFromCallsign] = useState("");
  const [toCallsign, setToCallsign] = useState("");
  const [message, setMessage] = useState("");
  const [significant, setSignificant] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!message.trim()) return;
    startTransition(async () => {
      const result = await logRadioEntryAction(operationId, message.trim(), {
        channel: channel.trim() || undefined,
        fromCallsign: fromCallsign.trim() || undefined,
        toCallsign: toCallsign.trim() || undefined,
        significant,
      });
      if (result.error) toast.error(result.error);
      else {
        setMessage("");
        setSignificant(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        <div className="flex gap-2">
          <Input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Channel" className="w-28" disabled={pending} />
          <Input value={fromCallsign} onChange={(e) => setFromCallsign(e.target.value)} placeholder="From" className="w-28" disabled={pending} />
          <Input value={toCallsign} onChange={(e) => setToCallsign(e.target.value)} placeholder="To" className="w-28" disabled={pending} />
        </div>
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" disabled={pending} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={significant} onChange={(e) => setSignificant(e.target.checked)} disabled={pending} />
            Flag as significant
          </label>
          <Button size="sm" disabled={pending || !message.trim()} onClick={submit}>
            {pending ? "Logging…" : "Log entry"}
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {entries.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No radio traffic logged</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className={cn("text-foreground", entry.significant && "font-medium")}>{entry.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(entry.occurred_at)}
                  {entry.channel ? ` · Ch. ${entry.channel}` : ""}
                  {entry.from_callsign || entry.to_callsign
                    ? ` · ${[entry.from_callsign, entry.to_callsign].filter(Boolean).join(" → ")}`
                    : ""}
                  {entry.linked_event ? ` · linked to ${entry.linked_event.reference}` : ""}
                </p>
              </div>
              {entry.significant ? (
                <Badge variant="secondary" className="shrink-0 bg-warning-bg text-warning">
                  Significant
                </Badge>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
