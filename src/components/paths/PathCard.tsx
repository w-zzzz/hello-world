import Link from "next/link";
import { ArrowUpRight, Clock, ListOrdered } from "lucide-react";
import { DifficultyPill } from "./DifficultyPill";
import { formatHours, totalMinutes, type LearningPath } from "@/lib/paths";

export function PathCard({ path }: { path: LearningPath }) {
  const minutes = totalMinutes(path);
  return (
    <Link
      href={`/paths/${path.slug}`}
      className="group relative block h-full rounded-3xl border border-soft surface p-7 hover:border-[var(--color-accent)]/40 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 overflow-hidden"
    >
      {/* hue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: `radial-gradient(circle, ${path.hue}, transparent 65%)` }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <DifficultyPill difficulty={path.difficulty} hue={path.hue} />
          <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-fg)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        <h3 className="mt-6 text-2xl font-semibold tracking-tight leading-snug text-balance">
          {path.title}
        </h3>
        <p className="mt-3 text-sm text-[var(--color-muted-fg)] leading-relaxed text-pretty line-clamp-2">
          {path.blurb}
        </p>

        <div className="mt-4 text-xs text-[var(--color-muted-fg)] line-clamp-2 leading-relaxed">
          {path.audience}
        </div>

        <div className="mt-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium">
          <span className="inline-flex items-center gap-1.5">
            <ListOrdered className="h-3.5 w-3.5" aria-hidden />
            {path.steps.length} steps
          </span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {path.duration}
          </span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
          <span>~{formatHours(minutes)} read</span>
        </div>

        {/* progress dots — visualize the # of steps */}
        <div className="mt-5 flex h-1 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
          <div
            className="h-full rounded-full"
            style={{
              width: "100%",
              background: `linear-gradient(to right, ${path.hue}, color-mix(in oklch, ${path.hue}, transparent 60%))`,
            }}
          />
        </div>
      </div>
    </Link>
  );
}
