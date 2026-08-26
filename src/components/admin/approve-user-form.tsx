"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/types";

type OperationOption = Pick<Tables<"operations">, "id" | "name" | "reference">;

export function ApproveUserForm({
  userId,
  roles,
  operations,
}: {
  userId: string;
  roles: Tables<"roles">[];
  operations: OperationOption[];
}) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [operationId, setEventId] = useState(operations[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const selectedRole = roles.find((r) => r.id === roleId);
  const needsEvent = selectedRole?.is_external ?? false;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      {needsEvent ? (
        <select
          className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          value={operationId}
          onChange={(e) => setEventId(e.target.value)}
        >
          {operations.length === 0 ? <option value="">No operations</option> : null}
          {operations.map((operation) => (
            <option key={operation.id} value={operation.id}>
              {operation.reference} — {operation.name}
            </option>
          ))}
        </select>
      ) : null}
      <Button
        size="sm"
        disabled={pending || !roleId || (needsEvent && !operationId)}
        onClick={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("userId", userId);
            formData.set("roleId", roleId);
            if (needsEvent) formData.set("operationId", operationId);
            const result = await approveUser(formData);
            if (result.error) toast.error(result.error);
            else toast.success("Account approved");
          });
        }}
      >
        Approve
      </Button>
    </div>
  );
}
