import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Global loading boundary used by Next.js while a server route segment is
 * resolving. We render an above-the-fold shimmer scaffold so the first paint
 * matches the topic / dashboard layouts and there's no width pop on hydrate.
 */
export default function Loading() {
  return (
    <div className="pt-32 pb-24" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-7xl px-6">
        <Skeleton className="h-3 w-28 mb-4" />
        <Skeleton className="h-12 w-3/4 mb-3" />
        <Skeleton className="h-12 w-1/2 mb-8" />
        <Skeleton className="h-5 w-full max-w-2xl mb-2" />
        <Skeleton className="h-5 w-full max-w-xl mb-12" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-soft surface p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1.5" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
