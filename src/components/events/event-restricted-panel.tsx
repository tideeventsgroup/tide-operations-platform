"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setEventClassificationAction, setEventRestrictedNarrativeAction } from "@/lib/actions/event-classification";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Enums } from "@/lib/supabase/types";
import type { getEventRestrictedNarrative } from "@/lib/domain/event-service";

type Narrative = Awaited<ReturnType<typeof getEventRestrictedNarrative>>;

const CLASSIFICATIONS: Enums<"classification_level">[] = ["internal", "confidential", "restricted"];
const CLASSIFICATION_LABEL: Record<Enums<"classification_level">, string> = {
  public: "Standard",
  client: "Standard",
  internal: "Standard",
  confidential: "Restricted",
  restricted: "Highly Restricted",
};

export function EventRestrictedPanel({
  eventId,
  classification,
  narrative,
}: {
  eventId: string;
  classification: Enums<"classification_level">;
  narrative: Narrative;
}) {
  const [pendingClass, setPendingClass] = useState<Enums<"classification_level">>(classification);
  const [body, setBody] = useState(narrative?.body ?? "");
  const [pending, startTransition] = useTransition();

  function saveClassification() {
    if (pendingClass === classification) return;
    startTransition(async () => {
      const result = await setEventClassificationAction(eventId, pendingClass);
      if (result.error) toast.error(result.error);
    });
  }

  function saveNarrative() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await setEventRestrictedNarrativeAction(eventId, body.trim());
      if (result.error) toast.error(result.error);
      else toast.success("Restricted detail saved");
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Raising this event&apos;s classification never hides it, its category, location, status, or priority from
        anyone with ordinary event access — only the detail recorded below is restricted.
      </p>

      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <div className="section-label">Classification</div>
        <div className="flex items-center gap-2">
          <Select value={pendingClass} onValueChange={(v) => setPendingClass((v ?? classification) as Enums<"classification_level">)}>
            <SelectTrigger disabled={pending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASSIFICATIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {CLASSIFICATION_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={pending || pendingClass === classification} onClick={saveClassification}>
            {pending ? "Saving…" : "Update classification"}
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <div className="section-label">Restricted detail</div>
        {narrative ? (
          <p className="text-xs text-muted-foreground">
            Last updated{" "}
            {new Date(narrative.updated_at ?? narrative.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            {narrative.updated_by_profile
              ? ` by ${[narrative.updated_by_profile.first_name, narrative.updated_by_profile.surname].filter(Boolean).join(" ")}`
              : ""}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No restricted detail recorded yet.</p>
        )}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Detail visible only to roles with restricted access"
          rows={6}
          disabled={pending}
        />
        <Button size="sm" disabled={pending || !body.trim() || body === narrative?.body} onClick={saveNarrative}>
          {pending ? "Saving…" : "Save restricted detail"}
        </Button>
      </div>
    </div>
  );
}
