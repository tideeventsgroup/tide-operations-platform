import { PageHeaderSkeleton, PanelSkeleton, TableSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <PageHeaderSkeleton />
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TableSkeleton rows={3} cols={2} />
        <TableSkeleton rows={3} cols={2} />
      </div>
    </div>
  );
}
