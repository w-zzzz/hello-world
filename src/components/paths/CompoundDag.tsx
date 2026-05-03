"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { TOPIC_BY_SLUG, PART_BY_SLUG } from "../../../content/curriculum";
import type { LearningPath } from "@/lib/paths";

type Node = {
  slug: string;
  label: string;
  short: string;
  partHueVar: string;
  /** Step index in the path (0..N-1). Prereqs not in path receive their own row. */
  row: number;
  col: number;
};

type Edge = {
  from: string;
  to: string;
  /** Whether this edge is part of the linear path (i→i+1). */
  primary: boolean;
};

const COL_W = 220;
const ROW_H = 78;
const PAD_X = 28;
const PAD_Y = 28;
const NODE_W = 188;
const NODE_H = 52;

/**
 * Lay out the steps as a vertical cascade (one per row). For each step's
 * external prereqs (prereqs that ARE in the path but appear earlier), draw
 * a curved arrow. We don't render prereqs that aren't part of the path,
 * to keep the picture honest about what the path itself teaches.
 */
function buildLayout(path: LearningPath): { nodes: Node[]; edges: Edge[]; w: number; h: number } {
  const slugs = path.steps.map((s) => s.topicSlug);
  const inPath = new Set(slugs);

  // Two columns: even rows on the left, odd rows on the right, so prereq arrows curve nicely.
  const nodes: Node[] = path.steps.map((s, i) => {
    const t = TOPIC_BY_SLUG[s.topicSlug];
    const part = PART_BY_SLUG[t.partSlug];
    const col = i % 2;
    return {
      slug: s.topicSlug,
      label: t.title,
      short: part.short,
      partHueVar: part.hueVar,
      row: i,
      col,
    };
  });

  const edges: Edge[] = [];
  // primary: linear sequence
  for (let i = 0; i < path.steps.length - 1; i++) {
    edges.push({ from: slugs[i], to: slugs[i + 1], primary: true });
  }
  // secondary: actual prereq edges that exist between in-path topics, skipping
  // the ones we already drew as primary linear edges.
  const primaryKeys = new Set(edges.map((e) => `${e.from}->${e.to}`));
  for (const s of path.steps) {
    const t = TOPIC_BY_SLUG[s.topicSlug];
    for (const p of t.prereqs) {
      if (!inPath.has(p)) continue;
      const key = `${p}->${s.topicSlug}`;
      if (primaryKeys.has(key)) continue;
      edges.push({ from: p, to: s.topicSlug, primary: false });
    }
  }

  const w = COL_W * 2 + PAD_X * 2;
  const h = path.steps.length * ROW_H + PAD_Y * 2;
  return { nodes, edges, w, h };
}

function nodePos(n: Node) {
  const x = PAD_X + n.col * COL_W + (COL_W - NODE_W) / 2;
  const y = PAD_Y + n.row * ROW_H;
  return { x, y, cx: x + NODE_W / 2, cy: y + NODE_H / 2 };
}

function bezierPath(
  fromN: Node,
  toN: Node
): string {
  const a = nodePos(fromN);
  const b = nodePos(toN);
  // start at bottom of `from`, end at top of `to`
  const sx = a.cx;
  const sy = a.y + NODE_H;
  const tx = b.cx;
  const ty = b.y;
  const dy = ty - sy;
  const c1y = sy + dy * 0.5;
  const c2y = ty - dy * 0.5;
  return `M ${sx} ${sy} C ${sx} ${c1y}, ${tx} ${c2y}, ${tx} ${ty}`;
}

export function CompoundDag({ path }: { path: LearningPath }) {
  const reduce = useReducedMotion();
  const { nodes, edges, w, h } = React.useMemo(() => buildLayout(path), [path]);

  return (
    <div className="rounded-3xl border border-soft surface overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-soft">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-fg)] font-medium">
            How this path compounds
          </div>
          <div className="mt-0.5 text-sm text-[var(--color-fg)]">
            Solid arrows are the reading order. Dashed arrows are real prerequisite dependencies between topics on the path.
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-5" style={{ background: path.hue }} />
            order
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-px w-5"
              style={{
                backgroundImage: `linear-gradient(to right, var(--color-muted-fg) 50%, transparent 50%)`,
                backgroundSize: "6px 1px",
              }}
            />
            prereq
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={`Dependency cascade for ${path.title}`}
          viewBox={`0 0 ${w} ${h}`}
          width="100%"
          style={{ maxHeight: "min(72vh, 720px)", minWidth: 480 }}
        >
          <defs>
            <marker
              id={`arrow-${path.slug}-primary`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={path.hue} />
            </marker>
            <marker
              id={`arrow-${path.slug}-secondary`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-muted-fg)" opacity="0.7" />
            </marker>
          </defs>

          {/* Edges */}
          <g>
            {edges.map((e, i) => {
              const fromN = nodes.find((n) => n.slug === e.from);
              const toN = nodes.find((n) => n.slug === e.to);
              if (!fromN || !toN) return null;
              const d = bezierPath(fromN, toN);
              return (
                <motion.path
                  key={`${e.from}->${e.to}-${i}`}
                  d={d}
                  fill="none"
                  stroke={e.primary ? path.hue : "var(--color-muted-fg)"}
                  strokeOpacity={e.primary ? 0.85 : 0.45}
                  strokeWidth={e.primary ? 1.8 : 1}
                  strokeDasharray={e.primary ? undefined : "4 4"}
                  markerEnd={`url(#arrow-${path.slug}-${e.primary ? "primary" : "secondary"})`}
                  initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                  animate={reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: reduce ? 0 : 0.7,
                    delay: reduce ? 0 : 0.15 + i * 0.035,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((n, i) => {
              const { x, y } = nodePos(n);
              const partColor = `var(${n.partHueVar})`;
              return (
                <motion.g
                  key={n.slug}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.45,
                    delay: reduce ? 0 : i * 0.04,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                >
                  <rect
                    x={x}
                    y={y}
                    rx={12}
                    ry={12}
                    width={NODE_W}
                    height={NODE_H}
                    fill="var(--color-card)"
                    stroke={partColor}
                    strokeOpacity={0.55}
                    strokeWidth={1}
                  />
                  {/* part dot */}
                  <circle cx={x + 14} cy={y + NODE_H / 2} r={4.5} fill={partColor} />
                  {/* step number */}
                  <text
                    x={x + 26}
                    y={y + NODE_H / 2 + 1}
                    fontSize={10}
                    fontFamily="var(--font-mono)"
                    fill="var(--color-muted-fg)"
                    dominantBaseline="middle"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </text>
                  {/* label */}
                  <text
                    x={x + 46}
                    y={y + NODE_H / 2 + 1}
                    fontSize={12}
                    fontWeight={500}
                    fill="var(--color-fg)"
                    dominantBaseline="middle"
                  >
                    {truncate(n.label, 22)}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
