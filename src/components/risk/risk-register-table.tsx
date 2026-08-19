"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateRiskStatusAction } from "@/lib/actions/risks";
import { Button } from "@/components/ui/button";
import { RiskScoreBadge, RiskStatusBadge } from "@/components/status-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { listRisks } from "@/lib/domain/risk-service";
import type { Enums } from "@/lib/supabase/types";

type Risk = Awaited<ReturnType<typeof listRisks>>[number];

function ownerName(p: { first_name: string | null; surname: string | null; email: string } | null) {
  if (!p) return "—";
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.email;
}

const NEXT_ACTIONS: Partial<Record<Enums<"risk_status">, { status: Enums<"risk_status">; label: string }[]>> = {
  open: [
    { status: "mitigated", label: "Mark mitigated" },
    { status: "accepted", label: "Accept" },
  ],
  mitigated: [{ status: "closed", label: "Close" }],
  accepted: [{ status: "closed", label: "Close" }],
};

export function RiskRegisterTable({ eventId, risks }: { eventId: string; risks: Risk[] }) {
  const [pending, startTransition] = useTransition();

  function transition(riskId: string, status: Enums<"risk_status">) {
    startTransition(async () => {
      const result = await updateRiskStatusAction(riskId, eventId, status);
      if (result.error) toast.error(result.error);
    });
  }

  if (risks.length === 0) {
    return <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">No risks logged</div>;
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => (
            <TableRow key={risk.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">{risk.reference}</TableCell>
              <TableCell className="font-medium text-foreground">{risk.title}</TableCell>
              <TableCell className="text-muted-foreground">{risk.category ?? "—"}</TableCell>
              <TableCell>
                <RiskScoreBadge score={risk.risk_score ?? risk.likelihood * risk.impact} />
              </TableCell>
              <TableCell className="text-muted-foreground">{ownerName(risk.owner)}</TableCell>
              <TableCell>
                <RiskStatusBadge status={risk.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {(NEXT_ACTIONS[risk.status] ?? []).map((action) => (
                    <Button
                      key={action.status}
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => transition(risk.id, action.status)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
