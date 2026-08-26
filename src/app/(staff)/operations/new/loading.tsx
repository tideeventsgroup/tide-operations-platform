import { Skeleton } from "@/components/ui/skeleton";

export default function NewEventLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-5">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
