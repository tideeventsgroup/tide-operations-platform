"use client";

import { useActionState } from "react";
import { createClientAction } from "@/lib/actions/clients";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewClientPage() {
  const [state, action, pending] = useActionState(createClientAction, undefined);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <PageHeader title="New client" />

      <form action={action} className="space-y-5" noValidate>
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="legal_name">Legal name</Label>
            <Input id="legal_name" name="legal_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trading_name">Trading name</Label>
            <Input id="trading_name" name="trading_name" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="billing_email">Billing email</Label>
            <Input id="billing_email" name="billing_email" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address_line1">Address</Label>
          <Input id="address_line1" name="address_line1" placeholder="Address line 1" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postcode">Postcode</Label>
            <Input id="postcode" name="postcode" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create client"}
        </Button>
      </form>
    </div>
  );
}
