"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/apple/ScrollReveal";
import { cn } from "@/lib/utils";

export type EmptyStateSuggestion = {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  /** CSS variable name for tint (e.g. `--color-part-3`). */
  tint?: string;
};

/**
 * Calm empty-state hero used on the dashboard (and reusable elsewhere) when
 * there's no data yet. Keeps the visual rhythm of the rest of the site —
 * scroll-reveal cards, accent ring on focus — without screaming "you have
 * nothing." Renders 0–3 progressive-difficulty starter suggestions.
 */
export function EmptyState({
  eyebrow,
  headline,
  subhead,
  suggestions = [],
  className,
}: {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  suggestions?: EmptyStateSuggestion[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <ScrollReveal>
        <div className="max-w-3xl">
          {eyebrow && (
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
              {eyebrow}
            </div>
          )}
          <h2 className="mt-3 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-balance">
            {headline}
          </h2>
          {subhead && (
            <p className="mt-4 text-lg text-[var(--color-muted-fg)] max-w-2xl text-pretty">
              {subhead}
            </p>
          )}
        </div>
      </ScrollReveal>

      {suggestions.length > 0 && (
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {suggestions.map((s, i) => (
            <ScrollReveal key={s.href} as="li" delay={0.05 + i * 0.05}>
              <Link
                href={s.href}
                className="group block h-full rounded-3xl border border-soft bg-[var(--color-bg)] p-7 hover:border-[var(--color-accent)]/40 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-2xl text-xs font-semibold tabular-nums text-white"
                    style={{ backgroundColor: `var(${s.tint ?? "--color-accent"})` }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-fg)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
                  {s.eyebrow}
                </div>
                <div className="mt-1 text-xl font-semibold tracking-tight">{s.title}</div>
                <p className="mt-3 text-sm text-[var(--color-muted-fg)] leading-relaxed text-pretty">
                  {s.body}
                </p>
              </Link>
            </ScrollReveal>
          ))}
        </ul>
      )}
    </div>
  );
}
