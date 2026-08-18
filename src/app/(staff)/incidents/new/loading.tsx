import { Skeleton } from "@/components/ui/skeleton";

export default function NewIncidentLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-5">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
