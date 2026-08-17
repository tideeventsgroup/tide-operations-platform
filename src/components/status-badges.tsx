import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Enums } from "@/lib/supabase/types";

const STAGE_LABEL: Record<Enums<"event_lifecycle_stage">, string> = {
  enquiry: "Enquiry",
  proposal: "Proposal",
  confirmed: "Confirmed",
  planning: "Planning",
  documentation: "Documentation",
  client_review: "Client Review",
  readiness_review: "Readiness Review",
  operational_ready: "Operational Ready",
  live: "LIVE",
  stand_down: "Stand-down",
  post_event_review: "Post-event Review",
  closed: "Closed",
  archived: "Archived",
};

const STAGE_CLASS: Partial<Record<Enums<"event_lifecycle_stage">, string>> = {
  live: "bg-destructive text-destructive-foreground animate-pulse",
  operational_ready: "bg-success-bg text-success",
  closed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function LifecycleStageBadge({ stage }: { stage: Enums<"event_lifecycle_stage"> }) {
  return (
    <Badge variant="secondary" className={cn("font-semibold tracking-wide", STAGE_CLASS[stage])}>
      {STAGE_LABEL[stage]}
    </Badge>
  );
}

const PHASE_LABEL: Record<Enums<"event_phase">, string> = {
  build: "Build",
  pre_open: "Pre-open",
  ingress: "Ingress",
  live: "Live",
  peak: "Peak",
  egress: "Egress",
  closed_to_public: "Closed to Public",
  breakdown: "Breakdown",
  stand_down: "Stand-down",
};

export function EventPhaseBadge({ phase }: { phase: Enums<"event_phase"> }) {
  return (
    <Badge variant="outline" className="font-medium">
      {PHASE_LABEL[phase]}
    </Badge>
  );
}

const LOCATION_STATUS_LABEL: Record<Enums<"operational_location_status">, string> = {
  normal: "Normal",
  monitoring: "Monitoring",
  congested: "Congested",
  restricted: "Restricted",
  unavailable: "Unavailable",
  closed: "Closed",
};

const LOCATION_STATUS_CLASS: Partial<Record<Enums<"operational_location_status">, string>> = {
  congested: "bg-warning-bg text-warning",
  restricted: "bg-warning-bg text-warning",
  unavailable: "bg-destructive/10 text-destructive",
  closed: "bg-destructive/10 text-destructive",
};

export function LocationStatusBadge({ status }: { status: Enums<"operational_location_status"> }) {
  return (
    <Badge variant="secondary" className={cn(LOCATION_STATUS_CLASS[status])}>
      {LOCATION_STATUS_LABEL[status]}
    </Badge>
  );
}

const INCIDENT_STATUS_LABEL: Record<Enums<"incident_status">, string> = {
  reported: "Reported",
  acknowledged: "Acknowledged",
  active: "Active",
  monitoring: "Monitoring",
  awaiting_information: "Awaiting Information",
  external_agency_lead: "External Agency Lead",
  suspended: "Suspended",
  resolved: "Resolved",
  closed: "Closed",
};

const INCIDENT_STATUS_CLASS: Partial<Record<Enums<"incident_status">, string>> = {
  reported: "bg-warning-bg text-warning",
  active: "bg-destructive/10 text-destructive",
  resolved: "bg-success-bg text-success",
  closed: "bg-muted text-muted-foreground",
};

export function IncidentStatusBadge({ status }: { status: Enums<"incident_status"> }) {
  return (
    <Badge variant="secondary" className={cn("font-semibold", INCIDENT_STATUS_CLASS[status])}>
      {INCIDENT_STATUS_LABEL[status]}
    </Badge>
  );
}

const PRIORITY_CLASS: Record<string, string> = {
  destructive: "bg-destructive text-destructive-foreground",
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  muted: "bg-muted text-muted-foreground",
};

export function IncidentPriorityBadge({
  code,
  name,
  colorToken,
}: {
  code: string;
  name?: string;
  colorToken?: string;
}) {
  return (
    <Badge className={cn("font-bold tracking-wide", PRIORITY_CLASS[colorToken ?? "muted"])}>
      {code}
      {name ? ` ${name.toUpperCase()}` : ""}
    </Badge>
  );
}
