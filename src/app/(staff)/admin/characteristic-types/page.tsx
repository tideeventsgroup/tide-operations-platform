import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listCharacteristicTypes } from "@/lib/domain/operation-service";
import { PageHeader } from "@/components/page-header";
import { CharacteristicTypeRows } from "@/components/admin/characteristic-type-rows";

export default async function CharacteristicTypesAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const characteristicTypes = await listCharacteristicTypes();

  return (
    <>
      <PageHeader title="Characteristic Types" description="Tags available when describing an operation." />
      <CharacteristicTypeRows characteristicTypes={characteristicTypes} />
    </>
  );
}
