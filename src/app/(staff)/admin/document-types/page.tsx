import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listDocumentTypes } from "@/lib/domain/document-service";
import { PageHeader } from "@/components/page-header";
import { DocumentTypeRows } from "@/components/admin/document-type-rows";

export default async function DocumentTypesAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const documentTypes = await listDocumentTypes(profile.organisation_id);

  return (
    <>
      <PageHeader title="Document Types" description="The document types available when creating a document." />
      <DocumentTypeRows organisationId={profile.organisation_id} documentTypes={documentTypes} />
    </>
  );
}
