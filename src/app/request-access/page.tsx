"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestAccess } from "@/lib/actions/auth";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RequestAccessPage() {
  const [state, action, pending] = useActionState(requestAccess, undefined);

  return (
    <AuthShell
      title="Request access"
      description="New accounts start pending until a Tide administrator approves them."
      footer={
        <>
          Already have access?{" "}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form action={action} className="space-y-4" noValidate>
        {state?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" autoComplete="given-name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname">Surname</Label>
            <Input id="surname" name="surname" autoComplete="family-name" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Submitting…" : "Request access"}
        </Button>
      </form>
    </AuthShell>
  );
}
