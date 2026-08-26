"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { activateOperationAction, changeOperationStageAction } from "@/lib/actions/operations";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Enums } from "@/lib/supabase/types";

const PRE_LIVE_STAGES: Enums<"operation_lifecycle_stage">[] = [
  "enquiry",
  "proposal",
  "confirmed",
  "planning",
  "documentation",
  "client_review",
  "readiness_review",
  "operational_ready",
];

const POST_LIVE_STAGES: Enums<"operation_lifecycle_stage">[] = [
  "stand_down",
  "post_event_review",
  "closed",
  "archived",
];

const STAGE_LABEL: Record<Enums<"operation_lifecycle_stage">, string> = {
  enquiry: "Enquiry",
  proposal: "Proposal",
  confirmed: "Confirmed",
  planning: "Planning",
  documentation: "Documentation",
  client_review: "Client Review",
  readiness_review: "Readiness Review",
  operational_ready: "Operational Ready",
  live: "Live",
  stand_down: "Stand-down",
  post_event_review: "Post-event Review",
  closed: "Closed",
  archived: "Archived",
};

export function OperationLifecycleControls({
  operationId,
  stage,
}: {
  operationId: string;
  stage: Enums<"operation_lifecycle_stage">;
  eventControlManagerName?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [nextStage, setNextStage] = useState<Enums<"operation_lifecycle_stage">>(stage);
  const [comments, setComments] = useState("");
  const isPreLive = PRE_LIVE_STAGES.includes(stage);
  const isLive = stage === "live";
  const availableStages = isLive ? POST_LIVE_STAGES : PRE_LIVE_STAGES;

  function submitStageChange() {
    startTransition(async () => {
      const result = await changeOperationStageAction(operationId, nextStage);
      if (result.error) toast.error(result.error);
      else toast.success(`Stage changed to ${STAGE_LABEL[nextStage]}`);
    });
  }

  function submitActivate() {
    startTransition(async () => {
      const result = await activateOperationAction(operationId, comments || undefined);
      if (result.error) toast.error(result.error);
      else toast.success("Event is now LIVE");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
      <select
        value={nextStage}
        onChange={(e) => setNextStage(e.target.value as Enums<"operation_lifecycle_stage">)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
      >
        {availableStages.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABEL[s]}
          </option>
        ))}
      </select>
      <Button size="sm" variant="outline" disabled={pending || nextStage === stage} onClick={submitStageChange}>
        Change stage
      </Button>

      {isPreLive ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button size="sm" className="ml-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Activate Event
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activate event — go LIVE</AlertDialogTitle>
              <AlertDialogDescription>
                This starts live operations. Event Control, event reporting, and all live-ops surfaces
                activate immediately for every authorised user. This cannot be undone by editing the record —
                only by a further lifecycle transition.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1.5 px-1">
              <label htmlFor="activation-comments" className="text-sm text-muted-foreground">
                Activation comments (optional)
              </label>
              <Textarea
                id="activation-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={submitActivate} disabled={pending}>
                Confirm — go live
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
