"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { Zoom } from "@visx/zoom";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceY,
} from "d3-force";
import { TOPICS, PARTS, prereqEdges, PART_BY_SLUG } from "../../../content/curriculum";
import type { TopicMeta } from "@/lib/types";
import { useAllProgress } from "@/hooks/useProgress";

type Node = TopicMeta & { x: number; y: number; vx?: number; vy?: number };
type Link = { source: string | Node; target: string | Node };

const W = 1100;
const H = 760;

function computeLayout(): { nodes: Node[]; links: Link[] } {
  const nodes: Node[] = TOPICS.map((t) => ({
    ...t,
    x: 0,
    y: 0,
  }));
  const idx = new Map(nodes.map((n) => [n.slug, n] as const));
  const links: Link[] = prereqEdges()
    .filter(([a, b]) => idx.has(a) && idx.has(b))
    .map(([a, b]) => ({ source: idx.get(a)!, target: idx.get(b)! }));

  const sim = forceSimulation(nodes)
    .force("charge", forceManyBody<Node>().strength(-220))
    .force(
      "link",
      forceLink<Node, Link>(links)
        .id((d) => (d as Node).slug)
        .distance(60)
        .strength(0.6)
    )
    .force("collide", forceCollide<Node>().radius(28))
    // place each node at a vertical band per part (top->bottom = part 1->11)
    .force("y", forceY<Node>((n) => ((n.partIndex - 1) / 10) * (H - 120) + 60).strength(0.7))
    .force("center", forceCenter(W / 2, H / 2));

  for (let i = 0; i < 360; i++) sim.tick();
  sim.stop();
  return { nodes, links };
}

export function CurriculumGraph({ focus }: { focus?: string }) {
  const layout = React.useMemo(() => computeLayout(), []);
  const { progress } = useAllProgress();
  const progByTopic = React.useMemo(
    () => new Map(progress.map((p) => [p.topicSlug, p])),
    [progress]
  );

  const [hover, setHover] = React.useState<string | null>(null);
  const focusedPart = focus && PART_BY_SLUG[focus as keyof typeof PART_BY_SLUG];

  return (
    <div className="rounded-3xl border border-soft surface overflow-hidden">
      <ParentSize debounceTime={150}>
        {({ width }) => {
          const scale = Math.min(1.05, width / W);
          return (
            <svg width={width} height={H * scale} className="block">
              <defs>
                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
                {PARTS.map((p) => (
                  <linearGradient key={p.slug} id={`grad-${p.slug}`} x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor={`var(${p.hueVar})`} stopOpacity="0.95" />
                    <stop
                      offset="100%"
                      stopColor={`var(${PARTS[Math.min(PARTS.length - 1, p.index)]?.hueVar ?? p.hueVar})`}
                      stopOpacity="0.85"
                    />
                  </linearGradient>
                ))}
              </defs>
              <Zoom width={width} height={H * scale} scaleXMin={0.5} scaleXMax={3} scaleYMin={0.5} scaleYMax={3}>
                {(zoom) => (
                  <g
                    onMouseDown={zoom.dragStart}
                    onMouseMove={zoom.dragMove}
                    onMouseUp={zoom.dragEnd}
                    onMouseLeave={() => zoom.dragEnd()}
                    onWheel={(e) => {
                      const point = { x: e.clientX, y: e.clientY };
                      const dir = e.deltaY < 0 ? 1.1 : 0.9;
                      zoom.scale({ scaleX: dir, scaleY: dir, point });
                    }}
                    style={{ cursor: zoom.isDragging ? "grabbing" : "grab" }}
                  >
                    <rect x={0} y={0} width={width} height={H * scale} fill="transparent" />
                    <Group transform={zoom.toString()} top={0} left={(width - W * scale) / 2}>
                      <g transform={`scale(${scale})`}>
                        {/* edges */}
                        <g stroke="var(--color-border)" strokeWidth={1} fill="none" opacity={0.65}>
                          {layout.links.map((l, i) => {
                            const s = l.source as Node;
                            const t = l.target as Node;
                            const muted =
                              focusedPart &&
                              s.partSlug !== focusedPart.slug &&
                              t.partSlug !== focusedPart.slug;
                            return (
                              <path
                                key={i}
                                d={`M ${s.x} ${s.y} C ${(s.x + t.x) / 2} ${s.y}, ${(s.x + t.x) / 2} ${t.y}, ${t.x} ${t.y}`}
                                opacity={muted ? 0.18 : 0.6}
                              />
                            );
                          })}
                        </g>
                        {/* nodes */}
                        {layout.nodes.map((n) => {
                          const part = PARTS[n.partIndex - 1];
                          const p = progByTopic.get(n.slug);
                          const mastery = p?.mastery ?? 0;
                          const completed = p?.status === "completed";
                          const muted = focusedPart && n.partSlug !== focusedPart.slug;
                          const isHover = hover === n.slug;
                          const label = `${n.title} — ${part.short}, ${
                            completed
                              ? "completed"
                              : mastery > 0
                              ? `${Math.round(mastery * 100)}% mastery`
                              : "not started"
                          }`;
                          return (
                            <g
                              key={n.slug}
                              transform={`translate(${n.x}, ${n.y})`}
                              onMouseEnter={() => setHover(n.slug)}
                              onMouseLeave={() => setHover((h) => (h === n.slug ? null : h))}
                              opacity={muted ? 0.32 : 1}
                              style={{ cursor: "pointer" }}
                            >
                              <Link
                                href={`/learn/${n.slug}`}
                                aria-label={label}
                                tabIndex={0}
                                onFocus={() => setHover(n.slug)}
                                onBlur={() => setHover((h) => (h === n.slug ? null : h))}
                                className="focus-visible:outline-none [&:focus-visible_circle.focus-ring]:opacity-100"
                              >
                                <title>{label}</title>
                                {/* Larger transparent hit-target for touch + keyboard. */}
                                <circle r={22} fill="transparent" />
                                {/* Keyboard focus ring — only visible on :focus-visible. */}
                                <circle
                                  className="focus-ring"
                                  r={16}
                                  fill="none"
                                  stroke="var(--color-accent)"
                                  strokeWidth={2}
                                  opacity={0}
                                  style={{ transition: "opacity 150ms" }}
                                />
                                {n.hasHeroViz && (
                                  <circle
                                    r={20}
                                    fill={`var(${part.hueVar})`}
                                    opacity={0.18}
                                    filter="url(#softGlow)"
                                  />
                                )}
                                <circle
                                  r={isHover ? 14 : 10}
                                  fill={`url(#grad-${n.partSlug})`}
                                  stroke={completed ? "var(--color-fg)" : "transparent"}
                                  strokeWidth={completed ? 2 : 0}
                                  style={{ transition: "r 200ms cubic-bezier(0.32,0.72,0,1)" }}
                                />
                                {mastery > 0 && (
                                  <circle
                                    r={11}
                                    fill="none"
                                    stroke={`var(${part.hueVar})`}
                                    strokeWidth={2}
                                    strokeDasharray={`${mastery * 69.1} 69.1`}
                                    transform="rotate(-90)"
                                    opacity={0.95}
                                  />
                                )}
                              </Link>
                            </g>
                          );
                        })}
                      </g>
                    </Group>
                  </g>
                )}
              </Zoom>
            </svg>
          );
        }}
      </ParentSize>

      {/* Hover preview */}
      <AnimatePresence>
        {hover && (
          <motion.div
            key={hover}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="absolute left-1/2 -translate-x-1/2 bottom-4 z-10 rounded-2xl border border-soft surface px-5 py-3 shadow-xl shadow-black/10 max-w-md"
          >
            {(() => {
              const t = TOPICS.find((x) => x.slug === hover)!;
              const p = PARTS[t.partIndex - 1];
              return (
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md text-[10px] font-semibold tabular-nums text-white shrink-0"
                    style={{ backgroundColor: `var(${p.hueVar})` }}
                  >
                    {String(p.index).padStart(2, "0")}.{String(t.topicIndex).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight truncate">{t.title}</div>
                    <div className="text-xs text-[var(--color-muted-fg)] truncate">{t.hook}</div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
