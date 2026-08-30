import { PageHeaderSkeleton, PanelSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
      <PageHeaderSkeleton />
      <PanelSkeleton lines={4} />
    </div>
  );
}
