import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-40" />
      <Skeleton className="mt-8 h-20 w-full" />
    </div>
  );
}
