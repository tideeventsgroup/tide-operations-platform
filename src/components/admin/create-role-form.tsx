"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createRole } from "@/lib/actions/admin-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export function CreateRoleForm({ organisationId }: { organisationId: string }) {
  const [open, setOpen] = useState(false);
  const [isExternal, setIsExternal] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createRole(organisationId, formData);
      if (result?.error) toast.error(result.error);
      else {
        setOpen(false);
        setIsExternal(false);
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        + New role
      </Button>
    );
  }

  return (
    <form action={submit} className="w-full max-w-lg space-y-2 rounded-lg border border-border bg-card p-3">
      <Input name="code" placeholder="code_like_this" required autoFocus />
      <Input name="name" placeholder="Display name" required />
      <Input name="description" placeholder="Description (optional)" />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={isExternal} onCheckedChange={(c) => setIsExternal(c === true)} />
        External (portal / client-facing) role
        <input type="hidden" name="isExternal" value={isExternal ? "on" : ""} />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create role"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
