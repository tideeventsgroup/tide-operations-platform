"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/types";

export function ApproveUserForm({ userId, roles }: { userId: string; roles: Tables<"roles">[] }) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
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
      <Button
        size="sm"
        disabled={pending || !roleId}
        onClick={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("userId", userId);
            formData.set("roleId", roleId);
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
