"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  speed?: number; // 0 = no parallax, 1 = matches scroll, negative reverses
};

export function ParallaxLayer({ children, className, speed = 0.3 }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120 * speed]);

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={reduce ? undefined : { y }}
    >
      {children}
    </motion.div>
  );
}
