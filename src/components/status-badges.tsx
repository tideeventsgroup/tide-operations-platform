import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Enums } from "@/lib/supabase/types";

const STAGE_LABEL: Record<Enums<"operation_lifecycle_stage">, string> = {
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

const STAGE_CLASS: Partial<Record<Enums<"operation_lifecycle_stage">, string>> = {
  live: "bg-destructive text-destructive-foreground animate-pulse",
  operational_ready: "bg-success-bg text-success",
  closed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function LifecycleStageBadge({ stage }: { stage: Enums<"operation_lifecycle_stage"> }) {
  return (
    <Badge variant="secondary" className={cn("font-semibold tracking-wide", STAGE_CLASS[stage])}>
      {STAGE_LABEL[stage]}
    </Badge>
  );
}

const PHASE_LABEL: Record<Enums<"operation_phase">, string> = {
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

export function OperationPhaseBadge({ phase }: { phase: Enums<"operation_phase"> }) {
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

const INCIDENT_STATUS_LABEL: Record<Enums<"event_status">, string> = {
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

const INCIDENT_STATUS_CLASS: Partial<Record<Enums<"event_status">, string>> = {
  reported: "bg-warning-bg text-warning",
  active: "bg-destructive/10 text-destructive",
  resolved: "bg-success-bg text-success",
  closed: "bg-muted text-muted-foreground",
};

export function EventStatusBadge({ status }: { status: Enums<"event_status"> }) {
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

export function EventPriorityBadge({
  code,
  name,
  colorToken,
}: {
  code: string;
  name?: string;
  colorToken?: string;
}) {
  // P1/P2 need to out-rank every other badge on the row at a glance — colour
  // alone isn't enough (spec §11: never colour-only). Size/weight carry the
  // second signal.
  const isUrgent = code === "P1" || code === "P2";
  return (
    <Badge
      className={cn(
        "font-bold tracking-wide",
        isUrgent ? "h-6 px-2.5 text-[13px]" : "text-xs",
        PRIORITY_CLASS[colorToken ?? "muted"],
      )}
    >
      {code}
      {name ? ` ${name.toUpperCase()}` : ""}
    </Badge>
  );
}

const DOCUMENT_STATUS_LABEL: Record<Enums<"document_status">, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  issued: "Issued",
  superseded: "Superseded",
  archived: "Archived",
};

const DOCUMENT_STATUS_CLASS: Partial<Record<Enums<"document_status">, string>> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-warning-bg text-warning",
  approved: "bg-info-bg text-info",
  issued: "bg-success-bg text-success",
  superseded: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function DocumentStatusBadge({ status }: { status: Enums<"document_status"> }) {
  return (
    <Badge variant="secondary" className={cn("font-semibold", DOCUMENT_STATUS_CLASS[status])}>
      {DOCUMENT_STATUS_LABEL[status]}
    </Badge>
  );
}

const RISK_STATUS_LABEL: Record<Enums<"risk_status">, string> = {
  open: "Open",
  mitigated: "Mitigated",
  accepted: "Accepted",
  closed: "Closed",
};

const RISK_STATUS_CLASS: Record<Enums<"risk_status">, string> = {
  open: "bg-warning-bg text-warning",
  mitigated: "bg-info-bg text-info",
  accepted: "bg-muted text-muted-foreground",
  closed: "bg-success-bg text-success",
};

export function RiskStatusBadge({ status }: { status: Enums<"risk_status"> }) {
  return (
    <Badge variant="secondary" className={cn("font-semibold", RISK_STATUS_CLASS[status])}>
      {RISK_STATUS_LABEL[status]}
    </Badge>
  );
}

const CLIENT_STATUS_CLASS: Record<string, string> = {
  active: "bg-success-bg text-success",
};

export function ClientStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("font-semibold capitalize", CLIENT_STATUS_CLASS[status])}>
      {status}
    </Badge>
  );
}

const INVESTIGATION_STATUS_LABEL: Record<Enums<"investigation_status">, string> = {
  open: "Open",
  active: "Active",
  closed: "Closed",
  archived: "Archived",
};

const INVESTIGATION_STATUS_CLASS: Record<Enums<"investigation_status">, string> = {
  open: "bg-warning-bg text-warning",
  active: "bg-info-bg text-info",
  closed: "bg-success-bg text-success",
  archived: "bg-muted text-muted-foreground",
};

export function InvestigationStatusBadge({ status }: { status: Enums<"investigation_status"> }) {
  return (
    <Badge variant="secondary" className={cn("font-semibold", INVESTIGATION_STATUS_CLASS[status])}>
      {INVESTIGATION_STATUS_LABEL[status]}
    </Badge>
  );
}

export function AuditScoreBadge({ score, status }: { score: number | null; status: Enums<"audit_submission_status"> }) {
  if (status !== "submitted") {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground font-semibold">
        Draft
      </Badge>
    );
  }
  const className = score === null ? "bg-muted text-muted-foreground" : score >= 90 ? "bg-success-bg text-success" : score >= 70 ? "bg-warning-bg text-warning" : "bg-destructive/10 text-destructive";
  return (
    <Badge variant="secondary" className={cn("font-semibold", className)}>
      {score !== null ? `${score}%` : "N/A"}
    </Badge>
  );
}

// 1-5 x 1-5 scoring: 1-4 low, 5-9 medium, 10-15 high, 16-25 critical —
// matches the standard 5x5 risk matrix bands most event-safety plans use.
export function RiskScoreBadge({ score }: { score: number }) {
  const band =
    score >= 16
      ? { label: "Critical", className: "bg-destructive text-destructive-foreground" }
      : score >= 10
        ? { label: "High", className: "bg-destructive/10 text-destructive" }
        : score >= 5
          ? { label: "Medium", className: "bg-warning-bg text-warning" }
          : { label: "Low", className: "bg-muted text-muted-foreground" };
  return (
    <Badge className={cn("font-bold tracking-wide", band.className)}>
      {score} · {band.label.toUpperCase()}
    </Badge>
  );
}
