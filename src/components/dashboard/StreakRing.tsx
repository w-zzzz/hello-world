"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";

export function StreakRing({ count, goal = 30 }: { count: number; goal?: number }) {
  const pct = Math.max(0, Math.min(1, count / goal));
  const c = 2 * Math.PI * 60;
  return (
    <div className="rounded-3xl border border-soft surface p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
        Streak
      </div>
      <div className="mt-3 grid place-items-center">
        <div className="relative h-[160px] w-[160px]">
          <svg
            role="img"
            aria-label={`Streak: ${count} of ${goal} days, ${Math.round(pct * 100)} percent`}
            viewBox="0 0 140 140"
            className="h-full w-full -rotate-90"
          >
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--color-muted)" strokeWidth="10" />
            <motion.circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="url(#streakGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - pct) }}
              transition={{ duration: 1.4, ease: [0.32, 0.72, 0, 1] }}
            />
            <defs>
              <linearGradient id="streakGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-part-2)" />
                <stop offset="100%" stopColor="var(--color-part-10)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="grid h-8 w-8 mx-auto place-items-center rounded-lg bg-gradient-to-br from-[var(--color-part-2)] to-[var(--color-part-10)] text-white">
                <Flame className="h-4 w-4" />
              </div>
              <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{count}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">days</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-[var(--color-muted-fg)] text-center">
        Goal {goal} · {Math.round(pct * 100)}%
      </div>
    </div>
  );
}
