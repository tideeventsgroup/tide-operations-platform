import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function ClientsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
