"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { endControlSessionAction, startControlSessionAction } from "@/lib/actions/flagship-control";
import { Button } from "@/components/ui/button";
import type { listControlRoles, listControlSessions } from "@/lib/domain/event-service";

type Role = Awaited<ReturnType<typeof listControlRoles>>[number];
type Session = Awaited<ReturnType<typeof listControlSessions>>[number];

function personName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "Unknown";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

export function ControlRosterPanel({ eventId, roles, sessions }: { eventId: string; roles: Role[]; sessions: Session[] }) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const onDuty = sessions.filter((s) => !s.ended_at);
  const history = sessions.filter((s) => s.ended_at);

  function signOn() {
    if (!roleId) return;
    startTransition(async () => {
      const result = await startControlSessionAction(eventId, roleId);
      if (result.error) toast.error(result.error);
    });
  }

  function signOff(sessionId: string) {
    startTransition(async () => {
      const result = await endControlSessionAction(eventId, sessionId);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="section-label">Event Control roster ({onDuty.length} on duty)</h2>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
          disabled={pending || roles.length === 0}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Button size="sm" disabled={pending || !roleId} onClick={signOn}>
          Sign on
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {onDuty.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No one currently on duty</div>
        ) : (
          onDuty.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="font-medium text-foreground">{personName(s.profiles)}</span>
                <span className="text-muted-foreground"> · {s.event_control_roles?.name}</span>
              </div>
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => signOff(s.id)}>
                Sign off
              </Button>
            </div>
          ))
        )}
      </div>

      {history.length > 0 ? (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer select-none">Duty history ({history.length})</summary>
          <div className="mt-2 divide-y divide-border rounded-lg border border-border bg-card">
            {history.map((s) => (
              <div key={s.id} className="px-4 py-2 text-sm">
                <span className="font-medium text-foreground">{personName(s.profiles)}</span>
                <span className="text-muted-foreground"> · {s.event_control_roles?.name}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
