"use client";

import * as React from "react";
import { motion } from "motion/react";
import { type TimelineEvent } from "@/lib/timeline";

type Props = {
  events: TimelineEvent[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  hue: string;
};

type Edge = { from: string; to: string };
type Path = { d: string; key: string };

/**
 * Draws subtle SVG bezier curves connecting `builds_on` predecessors to their
 * descendants when both live in the same era. Recomputes on resize.
 */
export function CompoundArrow({ events, containerRef, hue }: Props) {
  const [paths, setPaths] = React.useState<Path[]>([]);
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const edges = React.useMemo<Edge[]>(() => {
    const ids = new Set(events.map((e) => e.id));
    const out: Edge[] = [];
    for (const e of events) {
      for (const src of e.builds_on ?? []) {
        if (ids.has(src)) out.push({ from: src, to: e.id });
      }
    }
    return out;
  }, [events]);

  const recompute = React.useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    setSize({ w: rootRect.width, h: rootRect.height });

    const yFor = (id: string): { x: number; y: number } | null => {
      const el = root.querySelector<HTMLElement>(`[data-event-id="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      // position dot is ~ left:14-22px, top:28px
      const x = r.left - rootRect.left + 22;
      const y = r.top - rootRect.top + 28;
      return { x, y };
    };

    const next: Path[] = [];
    for (const e of edges) {
      const a = yFor(e.from);
      const b = yFor(e.to);
      if (!a || !b) continue;
      // Curve out to the left of the spine, then back in.
      const dx = -40 - Math.min(60, Math.abs(b.y - a.y) * 0.05);
      const c1x = a.x + dx;
      const c1y = a.y + (b.y - a.y) * 0.25;
      const c2x = b.x + dx;
      const c2y = a.y + (b.y - a.y) * 0.75;
      const d = `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
      next.push({ d, key: `${e.from}->${e.to}` });
    }
    setPaths(next);
  }, [edges, containerRef]);

  React.useEffect(() => {
    recompute();
    const ro = new ResizeObserver(() => recompute());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", recompute);
    // re-run after first paint to capture final layout
    const t = window.setTimeout(recompute, 80);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
      window.clearTimeout(t);
    };
  }, [recompute, containerRef]);

  if (size.w === 0 || size.h === 0 || paths.length === 0) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-0"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
    >
      <defs>
        <linearGradient id={`arrow-grad-${hue.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hue} stopOpacity="0.55" />
          <stop offset="100%" stopColor={hue} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {paths.map(({ d, key }, i) => (
        <motion.path
          key={key}
          d={d}
          fill="none"
          stroke={`url(#arrow-grad-${hue.replace(/\W/g, "")})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: Math.min(0.02 * i, 0.4) }}
        />
      ))}
    </svg>
  );
}
