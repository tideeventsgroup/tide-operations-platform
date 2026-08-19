"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approveDocumentAction,
  archiveDocumentAction,
  issueDocumentAction,
  submitDocumentForReviewAction,
} from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { getDocument } from "@/lib/domain/document-service";

type Document = Awaited<ReturnType<typeof getDocument>>;
type ActiveAction = null | "approve" | "archive";

export function DocumentWorkflowActions({ document }: { document: Document }) {
  const [active, setActive] = useState<ActiveAction>(null);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string; success?: boolean }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
      else {
        toast.success("Updated");
        setActive(null);
        setText("");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {document.status === "draft" ? (
          <Button size="sm" disabled={pending} onClick={() => run(() => submitDocumentForReviewAction(document.id))}>
            Submit for review
          </Button>
        ) : null}

        {document.status === "in_review" ? (
          <Button size="sm" variant="outline" onClick={() => setActive(active === "approve" ? null : "approve")}>
            Approve
          </Button>
        ) : null}

        {document.status === "approved" ? (
          <Button size="sm" disabled={pending} onClick={() => run(() => issueDocumentAction(document.id))}>
            Issue
          </Button>
        ) : null}

        {document.status !== "archived" ? (
          <Button size="sm" variant="ghost" onClick={() => setActive(active === "archive" ? null : "archive")}>
            Archive
          </Button>
        ) : null}
      </div>

      {active === "approve" ? (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Comments (optional)" className="flex-1" />
          <Button size="sm" disabled={pending} onClick={() => run(() => approveDocumentAction(document.id, text.trim() || undefined))}>
            Confirm approve
          </Button>
        </div>
      ) : null}

      {active === "archive" ? (
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reason for archiving" className="flex-1" />
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || !text.trim()}
            onClick={() => run(() => archiveDocumentAction(document.id, text.trim()))}
          >
            Confirm archive
          </Button>
        </div>
      ) : null}
    </div>
  );
}
