"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/types";

type EventOption = Pick<Tables<"events">, "id" | "name" | "reference">;

export function ApproveUserForm({
  userId,
  roles,
  events,
}: {
  userId: string;
  roles: Tables<"roles">[];
  events: EventOption[];
}) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
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
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          {events.length === 0 ? <option value="">No events</option> : null}
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.reference} — {event.name}
            </option>
          ))}
        </select>
      ) : null}
      <Button
        size="sm"
        disabled={pending || !roleId || (needsEvent && !eventId)}
        onClick={() => {
          startTransition(async () => {
            const formData = new FormData();
            formData.set("userId", userId);
            formData.set("roleId", roleId);
            if (needsEvent) formData.set("eventId", eventId);
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
