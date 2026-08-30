"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePersonDescriptionAction } from "@/lib/actions/event-intelligence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Enums } from "@/lib/supabase/types";

type AgeGroup = Enums<"person_age_group">;
type Gender = Enums<"person_gender">;
type HeightBand = Enums<"person_height_band">;
type Build = Enums<"person_build">;

// The same banded suspect-description framework UK police systems (and
// Auror's own person-search filters) use for identification: coarse enough
// to describe someone from a witness account, structured enough to be
// filterable/comparable across records — not a free-text paragraph.
const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "under_18", label: "Under 18" },
  { value: "18_25", label: "18–25" },
  { value: "26_35", label: "26–35" },
  { value: "36_50", label: "36–50" },
  { value: "over_50", label: "Over 50" },
];
const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unknown_other", label: "Unknown / other" },
];
const HEIGHT_BANDS: { value: HeightBand; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "short", label: "Short" },
  { value: "average", label: "Average" },
  { value: "tall", label: "Tall" },
  { value: "very_tall", label: "Very tall" },
];
const BUILDS: { value: Build; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "slender", label: "Slender" },
  { value: "average", label: "Average" },
  { value: "muscular", label: "Muscular" },
  { value: "large", label: "Large" },
];

export function PersonDescriptionPanel({
  personId,
  ageGroup,
  gender,
  heightBand,
  build,
  distinguishingFeatures,
  clothingDescription,
}: {
  personId: string;
  ageGroup: AgeGroup | null;
  gender: Gender | null;
  heightBand: HeightBand | null;
  build: Build | null;
  distinguishingFeatures: string | null;
  clothingDescription: string | null;
}) {
  const [form, setForm] = useState({
    ageGroup: ageGroup ?? "",
    gender: gender ?? "",
    heightBand: heightBand ?? "",
    build: build ?? "",
    distinguishingFeatures: distinguishingFeatures ?? "",
    clothingDescription: clothingDescription ?? "",
  });
  const [pending, startTransition] = useTransition();

  const dirty =
    form.ageGroup !== (ageGroup ?? "") ||
    form.gender !== (gender ?? "") ||
    form.heightBand !== (heightBand ?? "") ||
    form.build !== (build ?? "") ||
    form.distinguishingFeatures !== (distinguishingFeatures ?? "") ||
    form.clothingDescription !== (clothingDescription ?? "");

  function save() {
    startTransition(async () => {
      const result = await updatePersonDescriptionAction(personId, {
        ageGroup: (form.ageGroup || undefined) as AgeGroup | undefined,
        gender: (form.gender || undefined) as Gender | undefined,
        heightBand: (form.heightBand || undefined) as HeightBand | undefined,
        build: (form.build || undefined) as Build | undefined,
        distinguishingFeatures: form.distinguishingFeatures || undefined,
        clothingDescription: form.clothingDescription || undefined,
      });
      if (result.error) toast.error(result.error);
      else toast.success("Description updated");
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="section-label mb-3">Description</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Age</Label>
          <Select value={form.ageGroup || undefined} onValueChange={(v) => setForm((f) => ({ ...f, ageGroup: v as string }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unset" />
            </SelectTrigger>
            <SelectContent>
              {AGE_GROUPS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select value={form.gender || undefined} onValueChange={(v) => setForm((f) => ({ ...f, gender: v as string }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unset" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Height</Label>
          <Select value={form.heightBand || undefined} onValueChange={(v) => setForm((f) => ({ ...f, heightBand: v as string }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unset" />
            </SelectTrigger>
            <SelectContent>
              {HEIGHT_BANDS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Build</Label>
          <Select value={form.build || undefined} onValueChange={(v) => setForm((f) => ({ ...f, build: v as string }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unset" />
            </SelectTrigger>
            <SelectContent>
              {BUILDS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="clothing">Clothing</Label>
          <Input
            id="clothing"
            value={form.clothingDescription}
            onChange={(e) => setForm((f) => ({ ...f, clothingDescription: e.target.value }))}
            placeholder="e.g. Black hooded jacket, grey trainers"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marks">Distinguishing features</Label>
          <Input
            id="marks"
            value={form.distinguishingFeatures}
            onChange={(e) => setForm((f) => ({ ...f, distinguishingFeatures: e.target.value }))}
            placeholder="e.g. Scar above left eyebrow, neck tattoo"
          />
        </div>
      </div>
      {dirty ? (
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
