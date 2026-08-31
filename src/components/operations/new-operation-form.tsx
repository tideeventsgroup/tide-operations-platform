"use client";

import { useActionState } from "react";
import { createOperationAction } from "@/lib/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/types";

export function NewOperationForm({
  clients,
  defaultClientId,
}: {
  clients: Tables<"clients">[];
  defaultClientId?: string;
}) {
  const [state, action, pending] = useActionState(createOperationAction, undefined);
  const currentYear = new Date().getFullYear();

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="client_id">Client</Label>
        <Select name="client_id" defaultValue={defaultClientId}>
          <SelectTrigger id="client_id" className="w-full">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.trading_name || client.legal_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Event name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" name="year" type="number" defaultValue={currentYear} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" name="start_date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End date</Label>
          <Input id="end_date" name="end_date" type="date" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" placeholder="e.g. Festival" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="local_authority">Local authority</Label>
          <Input id="local_authority" name="local_authority" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expected_attendance">Expected attendance</Label>
          <Input id="expected_attendance" name="expected_attendance" type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licensed_capacity">Licensed capacity</Label>
          <Input id="licensed_capacity" name="licensed_capacity" type="number" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create event"}
      </Button>
    </form>
  );
}
