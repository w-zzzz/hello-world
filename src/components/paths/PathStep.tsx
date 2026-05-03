import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { ResolvedStep } from "@/lib/paths";

export function PathStep({
  step,
  total,
  hue,
}: {
  step: ResolvedStep;
  total: number;
  hue: string;
}) {
  const minutes = step.estMinutes ?? step.topic.estMinutes;
  const partColor = `var(${step.part.hueVar})`;
  const num = String(step.index + 1).padStart(2, "0");
  return (
    <li className="relative">
      {/* connector line — drawn for all but the last step */}
      {step.index < total - 1 && (
        <span
          aria-hidden
          className="absolute left-[27px] top-14 bottom-[-2.5rem] w-px"
          style={{
            background: `linear-gradient(to bottom, color-mix(in oklch, ${partColor}, transparent 60%), color-mix(in oklch, ${hue}, transparent 80%))`,
          }}
        />
      )}

      <article className="group relative flex gap-5 rounded-3xl border border-soft surface p-6 sm:p-7 hover:border-[var(--color-accent)]/40 transition-colors">
        {/* step number badge */}
        <div className="relative z-10 shrink-0">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-white font-mono text-base font-semibold tabular-nums shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${partColor}, color-mix(in oklch, ${hue}, ${partColor} 50%))`,
            }}
          >
            {num}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] font-medium"
              style={{
                color: partColor,
                background: `color-mix(in oklch, ${partColor}, transparent 88%)`,
              }}
            >
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: partColor }} />
              {step.part.short}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-muted-fg)]">
              <Clock className="h-3 w-3" aria-hidden />
              {minutes}m
            </span>
          </div>

          <h3 className="mt-3 text-xl sm:text-2xl font-semibold tracking-tight leading-snug text-balance">
            {step.topic.title}
          </h3>
          <p className="mt-1.5 text-sm text-[var(--color-muted-fg)] italic">
            {step.topic.hook}
          </p>

          <div
            className="mt-5 rounded-2xl border border-soft bg-[var(--color-muted)] px-4 py-3 text-sm leading-relaxed text-[var(--color-fg)]/90"
          >
            <span
              className="mr-2 align-middle text-[10px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: hue }}
            >
              Why now
            </span>
            <span className="text-pretty">{step.why}</span>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <Link
              href={`/learn/${step.topic.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              Begin
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {step.topic.flagship && (
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
                Flagship topic
              </span>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}
