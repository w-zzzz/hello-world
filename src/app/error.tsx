"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Global error boundary. Next.js calls `reset()` to retry rendering the
 * failing route segment without a full page reload — the user shouldn't
 * lose their place in the app shell.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surface the error to the dev console; in prod this could go to a logger.
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalError]", error);
    }
  }, [error]);

  return (
    <div className="min-h-[80vh] grid place-items-center px-6 py-24">
      <div className="text-center max-w-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-rose-500/15 text-rose-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="mt-6 text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
          Something went sideways
        </div>
        <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] text-balance">
          A page failed to render.
        </h1>
        <p className="mt-4 text-base text-[var(--color-muted-fg)] text-pretty">
          We hit an unexpected error while loading this section. Try again — most issues
          clear on a retry. If it keeps happening, return to the map and pick another topic.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs font-mono text-[var(--color-muted-fg)]">
            digest: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-5 py-2.5 text-sm font-medium hover:scale-[1.02] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          >
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 rounded-full border border-soft px-5 py-2.5 text-sm font-medium hover:bg-[var(--color-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          >
            Back to the map
          </Link>
        </div>
      </div>
    </div>
  );
}
