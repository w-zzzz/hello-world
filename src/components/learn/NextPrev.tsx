import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { TopicMeta } from "@/lib/types";

export function NextPrev({ prev, next }: { prev: TopicMeta | null; next: TopicMeta | null }) {
  return (
    <nav className="mt-20 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/learn/${prev.slug}`}
          className="group rounded-2xl border border-soft surface p-5 hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-muted)]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
            Previous
          </div>
          <div className="mt-2 font-semibold leading-tight">{prev.title}</div>
          <div className="text-xs text-[var(--color-muted-fg)] mt-1 line-clamp-1">{prev.hook}</div>
        </Link>
      ) : <span />}
      {next ? (
        <Link
          href={`/learn/${next.slug}`}
          className="group rounded-2xl border border-soft surface p-5 text-right hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-muted)]/40 transition-colors sm:text-right"
        >
          <div className="flex items-center justify-end gap-1 text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
            Next
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-2 font-semibold leading-tight">{next.title}</div>
          <div className="text-xs text-[var(--color-muted-fg)] mt-1 line-clamp-1">{next.hook}</div>
        </Link>
      ) : <span />}
    </nav>
  );
}
