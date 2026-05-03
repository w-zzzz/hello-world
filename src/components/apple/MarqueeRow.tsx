"use client";

import * as React from "react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Infinite horizontal marquee. Honors `prefers-reduced-motion` (renders static)
 * and pauses while the pointer hovers — useful for actually reading the items
 * (e.g. researcher names) without the row sliding away. Pause uses Motion's
 * imperative `useAnimationControls` because the keyframe `animate` prop can't
 * be paused declaratively.
 */
export function MarqueeRow({
  items,
  speed = 40,
  className,
}: {
  items: React.ReactNode[];
  speed?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const doubled = [...items, ...items];

  // Kick off the looping translate as soon as we mount (skip when reduced-motion).
  React.useEffect(() => {
    if (reduce) return;
    void controls.start({
      x: ["0%", "-50%"],
      transition: { duration: speed, ease: "linear", repeat: Infinity },
    });
  }, [controls, reduce, speed]);

  function pause() {
    if (!reduce) controls.stop();
  }
  function resume() {
    if (!reduce) {
      void controls.start({
        x: ["0%", "-50%"],
        transition: { duration: speed, ease: "linear", repeat: Infinity },
      });
    }
  }

  // CSS mask gradient creates a soft fade on both edges so items dissolve
  // rather than chop hard against the section background.
  const fadeMask =
    "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]";

  return (
    <div
      className={cn("relative overflow-hidden", fadeMask, className)}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      {/* Solid color edge fades complement the mask for the bg/section transition. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[var(--color-bg)] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[var(--color-bg)] to-transparent"
      />
      <motion.div
        className="flex gap-6 w-max will-change-transform"
        animate={controls}
      >
        {doubled.map((item, i) => (
          <div key={i} className="shrink-0">
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
