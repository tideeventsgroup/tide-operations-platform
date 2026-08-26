import { listClients } from "@/lib/domain/client-service";
import { PageHeader } from "@/components/page-header";
import { NewOperationForm } from "@/components/operations/new-operation-form";

export default async function NewEventPage({ searchParams }: PageProps<"/operations/new">) {
  const { client } = await searchParams;
  const clients = await listClients();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <PageHeader title="New event" />
      <NewOperationForm clients={clients} defaultClientId={typeof client === "string" ? client : undefined} />
    </div>
  );
}
