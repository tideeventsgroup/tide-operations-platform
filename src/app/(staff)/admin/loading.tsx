import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
      <PageHeaderSkeleton />
      <TableSkeleton rows={3} cols={3} />
      <TableSkeleton rows={4} cols={3} />
    </div>
  );
}
