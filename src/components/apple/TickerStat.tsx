"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useTransform, animate, useReducedMotion } from "motion/react";

export function TickerStat({
  to,
  label,
  duration = 1.6,
  prefix = "",
  suffix = "",
}: {
  to: number;
  label: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const value = useMotionValue(0);
  const display = useTransform(value, (v) => Math.round(v).toLocaleString());

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) {
      value.set(to);
      return;
    }
    const ctrls = animate(value, to, { duration, ease: [0.32, 0.72, 0, 1] });
    return () => ctrls.stop();
  }, [inView, to, duration, value, reduce]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl sm:text-6xl font-semibold tabular-nums tracking-tight">
        {prefix}
        <motion.span>{display}</motion.span>
        {suffix}
      </div>
      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--color-muted-fg)]">
        {label}
      </div>
    </div>
  );
}
