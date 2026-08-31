"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOwnProfile } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  firstName,
  surname,
  preferredName,
  phone,
}: {
  firstName: string | null;
  surname: string | null;
  preferredName: string | null;
  phone: string | null;
}) {
  const [form, setForm] = useState({
    firstName: firstName ?? "",
    surname: surname ?? "",
    preferredName: preferredName ?? "",
    phone: phone ?? "",
  });
  const [pending, startTransition] = useTransition();

  const dirty =
    form.firstName !== (firstName ?? "") ||
    form.surname !== (surname ?? "") ||
    form.preferredName !== (preferredName ?? "") ||
    form.phone !== (phone ?? "");

  function save() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("firstName", form.firstName.trim());
      formData.set("surname", form.surname.trim());
      if (form.preferredName.trim()) formData.set("preferredName", form.preferredName.trim());
      if (form.phone.trim()) formData.set("phone", form.phone.trim());
      const result = await updateOwnProfile(formData);
      if (result.error) toast.error(result.error);
      else toast.success("Profile updated");
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h2 className="section-label">Profile</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="settings-first-name">First name</Label>
          <Input
            id="settings-first-name"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-surname">Surname</Label>
          <Input
            id="settings-surname"
            value={form.surname}
            onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-preferred-name">Preferred name</Label>
          <Input
            id="settings-preferred-name"
            value={form.preferredName}
            onChange={(e) => setForm((f) => ({ ...f, preferredName: e.target.value }))}
            placeholder="Optional — shown instead of first name where there's room"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="settings-phone">Phone</Label>
          <Input
            id="settings-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Optional"
            disabled={pending}
          />
        </div>
      </div>
      {dirty ? (
        <div className="flex justify-end">
          <Button size="sm" disabled={pending || !form.firstName.trim() || !form.surname.trim()} onClick={save}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
