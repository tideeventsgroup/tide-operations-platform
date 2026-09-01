"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { addEventTagAction, removeEventTagAction } from "@/lib/actions/events";
import type { listEventTags } from "@/lib/domain/event-service";

type Tag = Awaited<ReturnType<typeof listEventTags>>[number];

// Cross-cutting, free-form — independent of category/priority, e.g. "VIP",
// "media interest", "repeat location". The real gap flagged against
// comparable UK control-room products (ECR Manager tags issues too).
export function EventTagsRow({ eventId, tags }: { eventId: string; tags: Tag[] }) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const tag = value.trim();
    if (!tag) return;
    startTransition(async () => {
      const result = await addEventTagAction(eventId, tag);
      if (result.error) toast.error(result.error);
      else setValue("");
    });
  }

  function remove(tagId: string) {
    startTransition(async () => {
      const result = await removeEventTagAction(eventId, tagId);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span
          key={t.id}
          className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
        >
          {t.tag}
          <button
            type="button"
            onClick={() => remove(t.id)}
            disabled={pending}
            aria-label={`Remove tag ${t.tag}`}
            className="text-muted-foreground/60 hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        disabled={pending}
        placeholder="+ Add tag"
        className="h-7 w-28 rounded-full border border-dashed border-border bg-transparent px-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
      />
    </div>
  );
}
