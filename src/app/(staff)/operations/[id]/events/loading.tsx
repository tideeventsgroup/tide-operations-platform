import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function EventIncidentsLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-8 py-8">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} cols={9} />
    </div>
  );
}
