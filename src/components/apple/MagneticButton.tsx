"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

type CommonProps = {
  children: React.ReactNode;
  className?: string;
  /** Max horizontal/vertical pull in pixels. Default 6. */
  strength?: number;
};

type AsLink = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type AsButton = CommonProps & {
  href?: undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
};

type Props = AsLink | AsButton;

/**
 * Wraps a CTA in a subtle magnetic pull-toward-cursor interaction. Movement is
 * spring-based and capped at `strength` px (default 6). Children get a slight
 * counter-translate so the label feels anchored. Honors reduced motion.
 */
export function MagneticButton(props: Props) {
  const { children, className, strength = 6 } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // Normalize by half-extent so we never push past `strength` regardless of size.
    const nx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
    const ny = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
    x.set(nx * strength);
    y.set(ny * strength);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const inner = (
    <motion.span
      style={reduce ? undefined : { x: sx, y: sy, display: "inline-flex" }}
      className="contents"
    >
      {children}
    </motion.span>
  );

  if ("href" in props && props.href) {
    return (
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn("relative inline-flex", className)}
      >
        <Link
          href={props.href}
          className="inline-flex items-center justify-center"
        >
          {inner}
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("relative inline-flex", className)}
    >
      <button
        type={props.type ?? "button"}
        onClick={props.onClick}
        className="inline-flex items-center justify-center"
      >
        {inner}
      </button>
    </div>
  );
}
