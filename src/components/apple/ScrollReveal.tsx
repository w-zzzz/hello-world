"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  blur?: boolean;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 32,
  blur = false,
  once = true,
}: Props) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: reduce
      ? { opacity: 1 }
      : { opacity: 0, y, filter: blur ? "blur(8px)" : "blur(0px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        delay,
        ease: [0.32, 0.72, 0, 1],
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-10% 0px -10% 0px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
