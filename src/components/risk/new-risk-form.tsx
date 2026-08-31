"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createRiskAction } from "@/lib/actions/risks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NewRiskForm({ operationId }: { operationId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createRiskAction(operationId, title.trim(), likelihood, impact, description.trim() || undefined, category.trim() || undefined);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Risk added");
        setTitle("");
        setCategory("");
        setDescription("");
        setLikelihood(3);
        setImpact(3);
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        New risk
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={pending} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Category (optional)</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} disabled={pending} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Description (optional)</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={pending} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:w-64">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Likelihood (1-5)</label>
          <Select value={String(likelihood)} onValueChange={(v) => setLikelihood(Number(v ?? 3))}>
            <SelectTrigger className="w-full" disabled={pending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Impact (1-5)</label>
          <Select value={String(impact)} onValueChange={(v) => setImpact(Number(v ?? 3))}>
            <SelectTrigger className="w-full" disabled={pending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !title.trim()}>
          {pending ? "Adding…" : "Add risk"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
