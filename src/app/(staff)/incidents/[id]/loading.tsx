import { Skeleton } from "@/components/ui/skeleton";
import { PanelSkeleton } from "@/components/skeletons";

export default function IncidentDetailLoading() {
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <div className="space-y-4">
          <PanelSkeleton lines={2} />
          <PanelSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
