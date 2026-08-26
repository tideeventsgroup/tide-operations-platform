"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/admin";

export function DeleteConfigButton({ onDelete, label }: { onDelete: () => Promise<ActionResult>; label: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await onDelete();
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" disabled={pending} onClick={handleDelete} aria-label={`Delete ${label}`}>
      <TrashIcon className="size-4" />
    </Button>
  );
}
