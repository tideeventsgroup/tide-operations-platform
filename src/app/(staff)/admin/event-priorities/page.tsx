import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listEventPriorities } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { EventPriorityRows } from "@/components/admin/event-priority-rows";

export default async function EventPrioritiesAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const priorities = await listEventPriorities(profile.organisation_id);

  return (
    <>
      <PageHeader title="Event Priorities" description="Priority levels available when reporting or triaging an event." />
      <EventPriorityRows organisationId={profile.organisation_id} priorities={priorities} />
    </>
  );
}
