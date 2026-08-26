"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrganisation } from "@/lib/actions/admin-organisation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/lib/supabase/types";

export function OrganisationForm({ organisation }: { organisation: Tables<"organisations"> }) {
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateOrganisation(organisation.id, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Organisation settings saved");
    });
  }

  return (
    <form action={submit} className="max-w-lg space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="code">
          Reference code
        </label>
        <Input id="code" value={organisation.code} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground">
          Used as the prefix on every generated reference (e.g. {organisation.code}-EVT-2026-0001). Not editable.
        </p>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="name">
          Name
        </label>
        <Input id="name" name="name" defaultValue={organisation.name} required disabled={pending} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="legalName">
          Legal name
        </label>
        <Input id="legalName" name="legalName" defaultValue={organisation.legal_name ?? ""} disabled={pending} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={organisation.status}
          disabled={pending}
          className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
