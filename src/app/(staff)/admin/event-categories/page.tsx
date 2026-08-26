import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/domain/auth-service";
import { listEventCategories } from "@/lib/domain/event-service";
import { PageHeader } from "@/components/page-header";
import { EventCategoryRows } from "@/components/admin/event-category-rows";

export default async function EventCategoriesAdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");
  if (!profile.organisation_id) redirect("/dashboard");

  const categories = await listEventCategories();

  return (
    <>
      <PageHeader title="Event Categories" description="The category options available when reporting an event." />
      <EventCategoryRows categories={categories} />
    </>
  );
}
