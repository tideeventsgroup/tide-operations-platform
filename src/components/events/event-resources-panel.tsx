"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestEventResourceAction, updateEventResourceStatusAction } from "@/lib/actions/event-coordination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { listEventResources } from "@/lib/domain/event-service";
import type { Enums } from "@/lib/supabase/types";

type Resource = Awaited<ReturnType<typeof listEventResources>>[number];
type ResourceStatus = Enums<"event_resource_status">;

const STATUS_CLASS: Record<ResourceStatus, string> = {
  requested: "bg-warning-bg text-warning",
  dispatched: "bg-info-bg text-info",
  on_scene: "bg-success-bg text-success",
  stood_down: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<ResourceStatus, string> = {
  requested: "Requested",
  dispatched: "Dispatched",
  on_scene: "On Scene",
  stood_down: "Stood Down",
};

const NEXT_STATUS: Partial<Record<ResourceStatus, ResourceStatus>> = {
  requested: "dispatched",
  dispatched: "on_scene",
  on_scene: "stood_down",
};

const NEXT_LABEL: Partial<Record<ResourceStatus, string>> = {
  requested: "Mark dispatched",
  dispatched: "Mark on scene",
  on_scene: "Stand down",
};

export function EventResourcesPanel({ eventId, resources }: { eventId: string; resources: Resource[] }) {
  const [resourceType, setResourceType] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!resourceType.trim()) return;
    startTransition(async () => {
      const result = await requestEventResourceAction(eventId, resourceType.trim(), description.trim() || undefined);
      if (result.error) toast.error(result.error);
      else {
        setResourceType("");
        setDescription("");
      }
    });
  }

  function advance(resourceId: string, status: ResourceStatus) {
    startTransition(async () => {
      const result = await updateEventResourceStatusAction(eventId, resourceId, status);
      if (result.error) toast.error(result.error);
    });
  }

  const activeCount = resources.filter((r) => r.status !== "stood_down").length;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="section-label">Resources</h2>
        {activeCount > 0 ? <span className="text-xs text-muted-foreground">{activeCount} active</span> : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <Input
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          placeholder="Resource type (e.g. Ambulance)"
          className="flex-1"
          disabled={pending}
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detail (optional)"
          className="flex-1"
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !resourceType.trim()}>
          {pending ? "Requesting…" : "Request"}
        </Button>
      </form>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {resources.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No resources requested</div>
        ) : (
          resources.map((resource) => {
            const next = NEXT_STATUS[resource.status];
            return (
              <div key={resource.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{resource.resource_type}</p>
                  {resource.description ? <p className="text-sm text-muted-foreground">{resource.description}</p> : null}
                  <p className="text-xs text-muted-foreground">{resource.reference}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className={cn("font-medium", STATUS_CLASS[resource.status])}>
                    {STATUS_LABEL[resource.status]}
                  </Badge>
                  {next ? (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => advance(resource.id, next)}>
                      {NEXT_LABEL[resource.status]}
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
