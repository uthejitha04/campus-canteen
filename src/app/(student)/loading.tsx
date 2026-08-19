import { Skeleton } from "@/components/ui/feedback";

export default function Loading() {
  return (
    <div className="px-5 pt-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-8 w-52" />
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[110px] rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
