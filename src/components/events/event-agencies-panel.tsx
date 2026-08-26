"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { notifyEventAgencyAction, updateEventAgencyStatusAction } from "@/lib/actions/event-agencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { listEventAgencies } from "@/lib/domain/event-service";
import type { Enums } from "@/lib/supabase/types";

type Agency = Awaited<ReturnType<typeof listEventAgencies>>[number];
type AgencyStatus = Enums<"event_agency_status">;

const STATUS_CLASS: Record<AgencyStatus, string> = {
  notified: "bg-warning-bg text-warning",
  attending: "bg-info-bg text-info",
  on_scene: "bg-success-bg text-success",
  stood_down: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<AgencyStatus, string> = {
  notified: "Notified",
  attending: "Attending",
  on_scene: "On Scene",
  stood_down: "Stood Down",
};

const NEXT_STATUS: Partial<Record<AgencyStatus, AgencyStatus>> = {
  notified: "attending",
  attending: "on_scene",
  on_scene: "stood_down",
};

const NEXT_LABEL: Partial<Record<AgencyStatus, string>> = {
  notified: "Mark attending",
  attending: "Mark on scene",
  on_scene: "Stand down",
};

export function EventAgenciesPanel({ eventId, agencies }: { eventId: string; agencies: Agency[] }) {
  const [agencyType, setAgencyType] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!agencyType.trim() || !agencyName.trim()) return;
    startTransition(async () => {
      const result = await notifyEventAgencyAction(
        eventId,
        agencyType.trim(),
        agencyName.trim(),
        contactName.trim() || undefined,
        contactNumber.trim() || undefined,
      );
      if (result.error) toast.error(result.error);
      else {
        setAgencyType("");
        setAgencyName("");
        setContactName("");
        setContactNumber("");
        setShowMore(false);
      }
    });
  }

  function advance(agencyId: string, status: AgencyStatus) {
    startTransition(async () => {
      const result = await updateEventAgencyStatusAction(eventId, agencyId, status);
      if (result.error) toast.error(result.error);
    });
  }

  const activeCount = agencies.filter((a) => a.status !== "stood_down").length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-label">Agencies</h2>
        {activeCount > 0 ? <span className="text-xs text-muted-foreground">{activeCount} active</span> : null}
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <div className="flex gap-2">
          <Input
            value={agencyType}
            onChange={(e) => setAgencyType(e.target.value)}
            placeholder="Agency type (e.g. Police)"
            className="flex-1"
            disabled={pending}
          />
          <Input
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            placeholder="Agency name"
            className="flex-1"
            disabled={pending}
          />
        </div>
        {showMore ? (
          <div className="flex gap-2">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name (optional)"
              className="flex-1"
              disabled={pending}
            />
            <Input
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Contact number (optional)"
              className="flex-1"
              disabled={pending}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Add contact details
          </button>
        )}
        <Button size="sm" disabled={pending || !agencyType.trim() || !agencyName.trim()} onClick={submit}>
          {pending ? "Notifying…" : "Notify agency"}
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {agencies.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No agencies notified</div>
        ) : (
          agencies.map((agency) => {
            const next = NEXT_STATUS[agency.status];
            return (
              <div key={agency.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {agency.agency_name} <span className="text-muted-foreground">· {agency.agency_type}</span>
                  </p>
                  {agency.contact_name || agency.contact_number ? (
                    <p className="text-sm text-muted-foreground">
                      {[agency.contact_name, agency.contact_number].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{agency.reference}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className={cn("font-medium", STATUS_CLASS[agency.status])}>
                    {STATUS_LABEL[agency.status]}
                  </Badge>
                  {next ? (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => advance(agency.id, next)}>
                      {NEXT_LABEL[agency.status]}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
