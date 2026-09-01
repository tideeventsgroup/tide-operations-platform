"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setEventWhat3wordsAction } from "@/lib/actions/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EventWhat3WordsField({ eventId, what3words }: { eventId: string; what3words: string | null }) {
  const [value, setValue] = useState(what3words ?? "");
  const [pending, startTransition] = useTransition();
  const dirty = value.trim().replace(/^\/+/, "") !== (what3words ?? "");

  function save() {
    startTransition(async () => {
      const result = await setEventWhat3wordsAction(eventId, value);
      if (result.error) toast.error(result.error);
      else toast.success("Saved");
    });
  }

  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground">what3words</span>
      <div className="flex items-center gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Not set"
          disabled={pending}
          className="h-7 w-36 border-none bg-transparent px-0 text-right font-mono text-[12.5px] shadow-none focus-visible:ring-0"
        />
        {dirty ? (
          <Button size="icon-xs" disabled={pending} onClick={save} aria-label="Save what3words">
            ✓
          </Button>
        ) : null}
      </div>
    </div>
  );
}
