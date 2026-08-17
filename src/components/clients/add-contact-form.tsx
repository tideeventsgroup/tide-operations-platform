"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { createContactAction } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Tables } from "@/lib/supabase/types";

export function AddContactForm({ clientId, roleTypes }: { clientId: string; roleTypes: Tables<"contact_role_types">[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [, action, pending] = useActionState(async (_prev: unknown, formData: FormData) => {
    const result = await createContactAction(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Contact added");
      formRef.current?.reset();
      setOpen(false);
    }
    return result;
  }, undefined);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Add contact
      </Button>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-lg border border-border bg-card p-4">
      <input type="hidden" name="client_id" value={clientId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" name="first_name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="surname">Surname</Label>
          <Input id="surname" name="surname" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Roles</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {roleTypes.map((role) => (
            <label key={role.code} className="flex items-center gap-1.5 text-sm">
              <Checkbox name="roles" value={role.code} />
              {role.name}
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save contact"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
