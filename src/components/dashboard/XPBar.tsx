"use client";

import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { levelOf } from "@/lib/mastery";

export function XPBar({ xp }: { xp: number }) {
  const lv = levelOf(xp);
  const span = lv.into + lv.toNext;
  const pct = span > 0 ? lv.into / span : 0;
  return (
    <div className="rounded-3xl border border-soft surface p-6">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)] font-medium">
          XP
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)]">
          <Trophy className="h-3.5 w-3.5 text-[var(--color-part-3)]" />
          Level {lv.level}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-3">
        <div className="text-4xl font-semibold tabular-nums tracking-tight">{xp.toLocaleString()}</div>
        <div className="text-xs text-[var(--color-muted-fg)]">/ {lv.nextThreshold.toLocaleString()}</div>
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-part-7)]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, pct * 100)}%` }}
          transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      <div className="mt-2 text-xs text-[var(--color-muted-fg)]">
        {lv.toNext.toLocaleString()} XP to level {lv.level + 1}
      </div>
    </div>
  );
}
