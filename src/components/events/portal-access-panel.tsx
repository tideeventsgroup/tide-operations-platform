"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { grantEventPortalAccessAction, setEventPortalEnabledAction } from "@/lib/actions/portal-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/lib/supabase/types";
import type { listEventPortalGrants } from "@/lib/domain/user-admin-service";

type ExternalRole = Pick<Tables<"roles">, "id" | "name">;
type Grant = Awaited<ReturnType<typeof listEventPortalGrants>>[number];

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "Unknown";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export function PortalAccessPanel({
  eventId,
  portalEnabled,
  externalRoles,
  grants,
}: {
  eventId: string;
  portalEnabled: boolean;
  externalRoles: ExternalRole[];
  grants: Grant[];
}) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(externalRoles[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setEventPortalEnabledAction(eventId, !portalEnabled);
      if (result.error) toast.error(result.error);
    });
  }

  function grant() {
    if (!email.trim() || !roleId) return;
    startTransition(async () => {
      const result = await grantEventPortalAccessAction(eventId, email.trim(), roleId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Portal access granted");
        setEmail("");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Client portal</p>
          <p className="text-xs text-muted-foreground">
            {portalEnabled ? "Enabled — granted contacts can view this event." : "Disabled — no one can access the portal for this event."}
          </p>
        </div>
        <Button size="sm" variant={portalEnabled ? "outline" : "default"} disabled={pending} onClick={toggle}>
          {portalEnabled ? "Disable" : "Enable"}
        </Button>
      </div>

      {portalEnabled ? (
        <>
          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" className="h-8 w-56" disabled={pending} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Role</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                disabled={pending}
              >
                {externalRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <Button size="sm" disabled={pending || !email.trim() || !roleId} onClick={grant}>
              Grant access
            </Button>
          </div>

          {grants.length > 0 ? (
            <div className="space-y-1 border-t border-border pt-3 text-sm">
              {grants
                .filter((g) => g.roles?.is_external)
                .map((g) => (
                  <div key={g.id} className="text-muted-foreground">
                    <span className="text-foreground">{personName(g.profiles)}</span> · {g.roles?.name}
                  </div>
                ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
