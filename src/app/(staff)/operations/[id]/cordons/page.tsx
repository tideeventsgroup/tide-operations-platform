import { notFound } from "next/navigation";
import { getOperation, listOperationCordons } from "@/lib/domain/operation-service";
import { PageHeader } from "@/components/page-header";
import { CordonsPanel } from "@/components/operations/cordons-panel";

export default async function OperationCordonsPage({ params }: PageProps<"/operations/[id]/cordons">) {
  const { id } = await params;

  let event;
  try {
    event = await getOperation(id);
  } catch {
    notFound();
  }

  const cordons = await listOperationCordons(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-8">
      <PageHeader
        title="Cordons & control points"
        description={`${event.name} — inner/outer cordons, rendezvous points, and casualty clearing stations.`}
      />
      <CordonsPanel operationId={id} cordons={cordons} />
    </div>
  );
}
