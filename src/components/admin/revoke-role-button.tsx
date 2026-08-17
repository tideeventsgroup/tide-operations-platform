"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { XIcon } from "lucide-react";
import { revokeRole } from "@/lib/actions/admin";

export function RevokeRoleButton({ userRoleId }: { userRoleId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Revoke role"
      disabled={pending}
      className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      onClick={() => {
        startTransition(async () => {
          const formData = new FormData();
          formData.set("userRoleId", userRoleId);
          const result = await revokeRole(formData);
          if (result.error) toast.error(result.error);
          else toast.success("Role revoked");
        });
      }}
    >
      <XIcon className="size-3" />
    </button>
  );
}
