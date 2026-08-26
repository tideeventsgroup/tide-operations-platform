"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getEvidenceDownloadUrlAction,
  listEvidenceCustodyLogAction,
  logEvidenceItemAction,
  updateEvidenceStatusAction,
} from "@/lib/actions/evidence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { listEvidenceCustodyLog, listEvidenceItems } from "@/lib/domain/evidence-service";
import type { Enums } from "@/lib/supabase/types";

type EvidenceItem = Awaited<ReturnType<typeof listEvidenceItems>>[number];
type CustodyEntry = Awaited<ReturnType<typeof listEvidenceCustodyLog>>[number];
type EvidenceStatus = Enums<"evidence_status">;

const STATUS_CLASS: Record<EvidenceStatus, string> = {
  logged: "bg-warning-bg text-warning",
  reviewed: "bg-info-bg text-info",
  released: "bg-success-bg text-success",
  disposed: "bg-muted text-muted-foreground",
};

const NEXT_STATUS: Partial<Record<EvidenceStatus, EvidenceStatus>> = {
  logged: "reviewed",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EventEvidencePanel({ eventId, operationId, items }: { eventId: string; operationId: string; items: EvidenceItem[] }) {
  const [itemType, setItemType] = useState("");
  const [description, setDescription] = useState("");
  const [collectedByName, setCollectedByName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!itemType.trim() || !description.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      if (file) formData.set("file", file);
      const result = await logEvidenceItemAction(
        eventId,
        operationId,
        itemType.trim(),
        description.trim(),
        { collectedByName: collectedByName.trim() || undefined },
        formData,
      );
      if (result.error) toast.error(result.error);
      else {
        setItemType("");
        setDescription("");
        setCollectedByName("");
        setFile(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Every access to a file-based item is written to its chain-of-custody log, not just status changes.
      </p>

      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <div className="flex gap-2">
          <Input value={itemType} onChange={(e) => setItemType(e.target.value)} placeholder="Type (e.g. CCTV still)" className="flex-1" disabled={pending} />
          <Input
            value={collectedByName}
            onChange={(e) => setCollectedByName(e.target.value)}
            placeholder="Collected by (optional)"
            className="flex-1"
            disabled={pending}
          />
        </div>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} disabled={pending} />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={pending}
          className="text-sm text-muted-foreground file:mr-2 file:rounded-md file:border file:border-input file:bg-transparent file:px-2 file:py-1 file:text-sm"
        />
        <Button size="sm" disabled={pending || !itemType.trim() || !description.trim()} onClick={submit}>
          {pending ? "Logging…" : "Log evidence"}
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {items.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No evidence logged</div>
        ) : (
          items.map((item) => <EvidenceRow key={item.id} eventId={eventId} item={item} />)
        )}
      </div>
    </div>
  );
}

function EvidenceRow({ eventId, item }: { eventId: string; item: EvidenceItem }) {
  const [custodyOpen, setCustodyOpen] = useState(false);
  const [custodyLog, setCustodyLog] = useState<CustodyEntry[] | null>(null);
  const [pendingReason, setPendingReason] = useState<EvidenceStatus | null>(null);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const next = NEXT_STATUS[item.status];

  function download() {
    if (!item.storage_path) return;
    startTransition(async () => {
      const result = await getEvidenceDownloadUrlAction(item.id, item.storage_path!);
      if (result.error) toast.error(result.error);
      else if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  function advance(status: EvidenceStatus, notes?: string) {
    startTransition(async () => {
      const result = await updateEvidenceStatusAction(eventId, item.id, status, notes || undefined);
      if (result.error) toast.error(result.error);
      else {
        setPendingReason(null);
        setReason("");
      }
    });
  }

  function toggleCustody() {
    if (custodyOpen) {
      setCustodyOpen(false);
      return;
    }
    setCustodyOpen(true);
    if (!custodyLog) {
      startTransition(async () => {
        const log = await listEvidenceCustodyLogAction(item.id);
        setCustodyLog(log);
      });
    }
  }

  return (
    <div className="px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">
            {item.description} <span className="text-muted-foreground">· {item.item_type}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {item.reference} · {item.classification}
            {item.file_name ? ` · ${item.file_name}${formatBytes(item.file_size) ? ` (${formatBytes(item.file_size)})` : ""}` : ""}
          </p>
          {item.sha256_hash ? <p className="mt-1 font-mono text-[11px] text-muted-foreground break-all">SHA-256: {item.sha256_hash}</p> : null}
        </div>
        <Badge variant="secondary" className={cn("shrink-0 font-medium", STATUS_CLASS[item.status])}>
          {item.status}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {item.storage_path ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={download}>
            Download
          </Button>
        ) : null}
        {next ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => advance(next)}>
            Mark reviewed
          </Button>
        ) : null}
        {item.status !== "disposed" && item.status !== "released" ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setPendingReason("released")}>
            Release
          </Button>
        ) : null}
        {item.status !== "disposed" ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setPendingReason("disposed")}>
            Dispose
          </Button>
        ) : null}
        <button type="button" onClick={toggleCustody} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
          {custodyOpen ? "Hide" : "View"} chain of custody
        </button>
      </div>

      {pendingReason ? (
        <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Reason to ${pendingReason === "released" ? "release" : "dispose of"} this item`}
            className="flex-1"
            disabled={pending}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={pending || !reason.trim()}
            onClick={() => advance(pendingReason, reason.trim())}
          >
            Confirm {pendingReason === "released" ? "release" : "disposal"}
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setPendingReason(null)}>
            Cancel
          </Button>
        </div>
      ) : null}

      {custodyOpen ? (
        <div className="mt-2 space-y-1 rounded-md border border-border bg-muted/30 p-2">
          {custodyLog === null ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : custodyLog.length === 0 ? (
            <p className="text-xs text-muted-foreground">No custody entries</p>
          ) : (
            custodyLog.map((entry) => (
              <div key={entry.id} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{entry.action}</span>
                {" · "}
                {[entry.actor?.first_name, entry.actor?.surname].filter(Boolean).join(" ") || "Unknown"}
                {" · "}
                {new Date(entry.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                {entry.notes ? ` · ${entry.notes}` : ""}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
