import Link from "next/link";
import { PARTS, topicsInPart } from "../../../content/curriculum";
import type { ProgressRow } from "@/hooks/useProgress";

export function PartProgress({ progress }: { progress: ProgressRow[] }) {
  const byTopic = new Map(progress.map((p) => [p.topicSlug, p]));
  return (
    <div className="rounded-3xl border border-soft surface p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
        Curriculum progress
      </div>
      <ul className="mt-5 space-y-3">
        {PARTS.map((p) => {
          const topics = topicsInPart(p.slug);
          const completed = topics.filter((t) => byTopic.get(t.slug)?.status === "completed").length;
          const inProgress = topics.filter((t) => byTopic.get(t.slug)?.status === "in_progress").length;
          const masterySum = topics.reduce((s, t) => s + (byTopic.get(t.slug)?.mastery ?? 0), 0);
          const avgMastery = topics.length ? masterySum / topics.length : 0;
          const pct = (completed + inProgress * 0.4 + avgMastery * 0.2) / topics.length;
          return (
            <li key={p.slug}>
              <Link
                href={`/map?focus=${p.slug}`}
                /* No aria-label here — visible text (title + "X/Y done · N%
                   mastery") already forms a clear accessible name. */
                className="group block rounded-2xl border border-soft bg-[var(--color-bg)] p-4 hover:border-[var(--color-accent)]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="grid h-7 w-7 place-items-center rounded-lg text-[10px] font-semibold tabular-nums shrink-0"
                      style={{
                        backgroundColor: `var(${p.hueVar})`,
                        color: `var(${p.hueVar}-fg)`,
                      }}
                    >
                      {String(p.index).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.title}</div>
                      <div className="text-xs text-[var(--color-muted-fg)] tabular-nums">
                        {completed}/{topics.length} done · {(avgMastery * 100).toFixed(0)}% mastery
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(2, pct * 100))}%`,
                      backgroundColor: `var(${p.hueVar})`,
                    }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
