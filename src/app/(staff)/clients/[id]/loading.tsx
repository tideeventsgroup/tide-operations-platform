import { PageHeaderSkeleton, PanelSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-8 py-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-4">
          <PanelSkeleton lines={1} />
          <PanelSkeleton lines={1} />
        </div>
      </div>
    </div>
  );
}
