import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pulsing placeholder primitive for loading states. Use to reserve layout
 * space while a server component or async chunk hydrates.
 *
 * @example
 *   <Skeleton className="h-6 w-40 rounded-md" />
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "animate-pulse rounded-md bg-[color-mix(in_oklch,_var(--color-muted),_transparent_30%)]",
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}
