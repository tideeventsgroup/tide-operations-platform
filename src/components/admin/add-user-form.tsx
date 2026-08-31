"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, UserPlus } from "lucide-react";
import { createUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/lib/supabase/types";

type OperationOption = Pick<Tables<"operations">, "id" | "name" | "reference">;

export function AddUserForm({ roles, operations }: { roles: Tables<"roles">[]; operations: OperationOption[] }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [operationId, setOperationId] = useState(operations[0]?.id ?? "");
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedRole = roles.find((r) => r.id === roleId);
  const needsOperation = selectedRole?.is_external ?? false;
  const valid = firstName.trim() && surname.trim() && email.trim() && roleId && (!needsOperation || operationId);

  function reset() {
    setFirstName("");
    setSurname("");
    setEmail("");
    setRoleId(roles[0]?.id ?? "");
    setOperationId(operations[0]?.id ?? "");
  }

  function submit() {
    if (!valid) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("firstName", firstName.trim());
      formData.set("surname", surname.trim());
      formData.set("email", email.trim());
      formData.set("roleId", roleId);
      if (needsOperation) formData.set("operationId", operationId);
      const result = await createUser(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.tempPassword && result.email) {
        setCreated({ email: result.email, tempPassword: result.tempPassword });
      }
      reset();
    });
  }

  if (created) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Account created for {created.email}</p>
        <p className="text-xs text-muted-foreground">
          Share this temporary password with them directly — it won&apos;t be shown again. They can sign in and should change it once
          in.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground">
            {created.tempPassword}
          </code>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => {
              navigator.clipboard.writeText(created.tempPassword);
              toast.success("Copied");
            }}
            aria-label="Copy password"
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setCreated(null)}>
          Add another user
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        Add user
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="new-user-first-name">First name</Label>
          <Input id="new-user-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-user-surname">Surname</Label>
          <Input id="new-user-surname" value={surname} onChange={(e) => setSurname(e.target.value)} disabled={pending} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-user-email">Email</Label>
        <Input id="new-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Role</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            disabled={pending}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        {needsOperation ? (
          <div className="space-y-1.5">
            <Label>Operation</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
              value={operationId}
              onChange={(e) => setOperationId(e.target.value)}
              disabled={pending}
            >
              {operations.length === 0 ? <option value="">No operations</option> : null}
              {operations.map((operation) => (
                <option key={operation.id} value={operation.id}>
                  {operation.reference} — {operation.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={!valid || pending} onClick={submit}>
          {pending ? "Creating…" : "Create account"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        A temporary password is generated and shown once — there&apos;s no invite email in this environment, so relay it to them
        directly.
      </p>
    </div>
  );
}
