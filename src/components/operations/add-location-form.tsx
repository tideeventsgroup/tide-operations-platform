"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/types";

export function AddLocationForm({ operationId, locations }: { operationId: string; locations: Tables<"operational_locations">[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("operational_locations").insert({
        operation_id: operationId,
        type: formData.get("type") as Tables<"operational_locations">["type"],
        name: String(formData.get("name")),
        parent_id: formData.get("parent_id") === "none" ? null : (formData.get("parent_id") as string),
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Location added");
        formRef.current?.reset();
        setOpen(false);
        window.location.reload();
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Add location
      </Button>
    );
  }

  return (
    <form ref={formRef} action={submit} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="loc-type">
          Type
        </label>
        <Select name="type" defaultValue="site">
          <SelectTrigger id="loc-type" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="site">Site</SelectItem>
            <SelectItem value="zone">Zone</SelectItem>
            <SelectItem value="area">Area</SelectItem>
            <SelectItem value="location">Location</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="loc-name">
          Name
        </label>
        <Input id="loc-name" name="name" required className="h-8 w-48" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="loc-parent">
          Parent
        </label>
        <Select name="parent_id" defaultValue="none">
          <SelectTrigger id="loc-parent" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
