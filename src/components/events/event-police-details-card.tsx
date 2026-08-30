"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { updateEventPoliceDetailsAction } from "@/lib/actions/event-agencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Classification = { code: string; name: string };

// A crime classification (the real Home Office/ONS notifiable-offence
// categories, not SENTINEL's own operational category) plus the police's
// own reference number for this event — the two fields a police incident/
// crime report itself would carry, so a genuinely criminal event carries
// the same identifiers on both sides.
export function EventPoliceDetailsCard({
  eventId,
  classifications,
  crimeClassificationCode,
  policeReference,
}: {
  eventId: string;
  classifications: Classification[];
  crimeClassificationCode: string | null;
  policeReference: string | null;
}) {
  const [classificationCode, setClassificationCode] = useState(crimeClassificationCode ?? "");
  const [reference, setReference] = useState(policeReference ?? "");
  const [pending, startTransition] = useTransition();

  const dirty = classificationCode !== (crimeClassificationCode ?? "") || reference !== (policeReference ?? "");

  function save() {
    startTransition(async () => {
      const result = await updateEventPoliceDetailsAction(eventId, classificationCode || null, reference || null);
      if (result.error) toast.error(result.error);
      else toast.success("Police details updated");
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="size-4 text-muted-foreground" />
        <h2 className="section-label">Police details</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Crime classification</Label>
          <Select value={classificationCode || undefined} onValueChange={(v) => setClassificationCode(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Not a recorded crime" />
            </SelectTrigger>
            <SelectContent>
              {classifications.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="police-reference">Police reference</Label>
          <Input
            id="police-reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. LC-2026-004821"
          />
        </div>
      </div>
      {dirty ? (
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
