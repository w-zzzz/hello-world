"use client";

import * as React from "react";
import { ERAS } from "@/lib/timeline";
import { cn } from "@/lib/utils";

type Props = {
  activeEra: string | null;
  counts: Record<string, number>;
};

export function EraChips({ activeEra, counts }: Props) {
  return (
    <nav
      aria-label="Jump to era"
      className="-mx-6 sm:mx-0 px-6 sm:px-0 overflow-x-auto scrollbar-none"
    >
      <ul className="flex items-center gap-2 min-w-max sm:flex-wrap">
        {ERAS.map((era) => {
          const active = era.slug === activeEra;
          return (
            <li key={era.slug}>
              <a
                href={`#era-${era.slug}`}
                className={cn(
                  "group inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-300",
                  active
                    ? "border-[var(--color-fg)]/40 text-[var(--color-fg)]"
                    : "border-soft text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:border-[var(--color-fg)]/30"
                )}
                style={{
                  backgroundColor: active
                    ? `color-mix(in oklch, ${era.hue}, transparent 86%)`
                    : undefined,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: era.hue }}
                  aria-hidden
                />
                <span>{era.title}</span>
                <span
                  className="tabular-nums text-[var(--color-muted-fg)]"
                  aria-label={`${counts[era.slug] ?? 0} events`}
                >
                  {counts[era.slug] ?? 0}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
