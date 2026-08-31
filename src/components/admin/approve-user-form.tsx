"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <Select value={roleId} onValueChange={(v) => setRoleId(v ?? "")}>
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {needsEvent ? (
        operations.length === 0 ? (
          <span className="text-sm text-muted-foreground">No operations</span>
        ) : (
          <Select value={operationId} onValueChange={(v) => setEventId(v ?? "")}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operations.map((operation) => (
                <SelectItem key={operation.id} value={operation.id}>
                  {operation.reference} — {operation.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
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
