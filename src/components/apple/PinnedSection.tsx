"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

type RenderProps = { progress: MotionValue<number> };

type Props = {
  className?: string;
  height?: string;
  children: (p: RenderProps) => React.ReactNode;
};

export function PinnedSection({ className, height = "300vh", children }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section ref={ref} className={cn("relative", className)} style={{ height: reduce ? "auto" : height }}>
      <div className={cn("sticky top-0 h-screen flex items-center justify-center overflow-hidden", reduce && "static h-auto py-32")}>
        {children({ progress })}
      </div>
      <motion.div aria-hidden className="sr-only" />
    </section>
  );
}
