"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changeOwnPassword } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  const valid = password.length >= 8 && password === confirm;

  function save() {
    if (!valid) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("password", password);
      formData.set("confirm", confirm);
      const result = await changeOwnPassword(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Password changed");
      setPassword("");
      setConfirm("");
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h2 className="section-label">Change password</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="settings-new-password">New password</Label>
          <Input
            id="settings-new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-confirm-password">Confirm new password</Label>
          <Input
            id="settings-confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={pending}
            autoComplete="new-password"
          />
        </div>
      </div>
      {password && confirm && password !== confirm ? <p className="text-xs text-destructive">Passwords don&apos;t match</p> : null}
      {password && password.length < 8 ? <p className="text-xs text-muted-foreground">At least 8 characters</p> : null}
      <div className="flex justify-end">
        <Button size="sm" disabled={!valid || pending} onClick={save}>
          {pending ? "Saving…" : "Update password"}
        </Button>
      </div>
    </div>
  );
}
