"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setAuditTemplateActiveAction } from "@/lib/actions/audits";
import { Button } from "@/components/ui/button";

export function AuditTemplateActiveToggle({ templateId, isActive }: { templateId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setAuditTemplateActiveAction(templateId, !isActive);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={toggle}>
      {isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
