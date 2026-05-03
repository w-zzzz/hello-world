"use client";

import * as React from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type Day = { date: string; count: number; correct: number };

const WEEKS = 12;
const DAYS = 7;

function intensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count < 2) return 1;
  if (count < 5) return 2;
  if (count < 10) return 3;
  return 4;
}

const cellClass: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-[var(--color-muted)]",
  1: "bg-[color-mix(in_oklch,var(--color-accent),transparent_75%)]",
  2: "bg-[color-mix(in_oklch,var(--color-accent),transparent_55%)]",
  3: "bg-[color-mix(in_oklch,var(--color-accent),transparent_30%)]",
  4: "bg-[var(--color-accent)]",
};

export function ActivityHeatmap() {
  const [data, setData] = React.useState<Day[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/activity")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: { data: Day[] }) => {
        if (!cancelled) setData(j.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pad to a 7×12 grid where the rightmost column ends today, so weekdays
  // line up correctly. We bucket days into columns of 7, oldest first.
  const grid = React.useMemo(() => {
    if (!data) return null;
    const padded: (Day | null)[] = [...data];
    // Right-align: prepend empty cells until length is divisible by DAYS.
    const remainder = padded.length % DAYS;
    if (remainder !== 0) {
      const pad = DAYS - remainder;
      for (let i = 0; i < pad; i++) padded.unshift(null);
    }
    const cols: (Day | null)[][] = [];
    for (let i = 0; i < padded.length; i += DAYS) {
      cols.push(padded.slice(i, i + DAYS));
    }
    return cols.slice(-WEEKS);
  }, [data]);

  const totals = React.useMemo(() => {
    if (!data) return { count: 0, days: 0, best: 0 };
    let count = 0;
    let days = 0;
    let best = 0;
    for (const d of data) {
      count += d.count;
      if (d.count > 0) days += 1;
      if (d.count > best) best = d.count;
    }
    return { count, days, best };
  }, [data]);

  return (
    <div className="rounded-3xl border border-soft surface p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
            Quiz activity
          </div>
          <div className="mt-1 text-sm text-[var(--color-muted-fg)]">
            Last {WEEKS} weeks
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums tracking-tight">
            {totals.count}
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
            attempts · {totals.days} active day{totals.days === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        {!grid && !error && (
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: WEEKS * DAYS }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-[3px] bg-[var(--color-muted)] animate-pulse"
                style={{ animationDelay: `${(i % 12) * 40}ms` }}
              />
            ))}
          </div>
        )}
        {error && (
          <div className="text-xs text-[var(--color-muted-fg)] py-4">
            Couldn&apos;t load activity ({error}).
          </div>
        )}
        {grid && (
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))`,
              gridAutoRows: "1fr",
            }}
            role="img"
            aria-label={`${totals.count} quiz attempts across the last ${WEEKS} weeks`}
          >
            {grid.map((col, ci) => (
              <div key={ci} className="grid gap-1" style={{ gridTemplateRows: `repeat(${DAYS}, minmax(0, 1fr))` }} aria-hidden="true">
                {col.map((d, ri) => {
                  if (!d) {
                    return <div key={ri} className="aspect-square rounded-[3px]" />;
                  }
                  const lvl = intensity(d.count);
                  const acc = d.count > 0 ? Math.round((d.correct / d.count) * 100) : 0;
                  return (
                    <div
                      key={ri}
                      title={`${d.date}: ${d.count} attempt${d.count === 1 ? "" : "s"}${
                        d.count ? ` · ${acc}% correct` : ""
                      }`}
                      className={cn(
                        "aspect-square rounded-[3px] transition-transform hover:scale-110",
                        cellClass[lvl]
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
        <span className="inline-flex items-center gap-1.5">
          <Flame className="h-3 w-3 text-[var(--color-part-1)]" />
          Best day: <span className="tabular-nums text-[var(--color-fg)] normal-case tracking-normal">{totals.best}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <span key={l} className={cn("h-2.5 w-2.5 rounded-[2px]", cellClass[l])} />
          ))}
          <span>More</span>
        </span>
      </div>
    </div>
  );
}
