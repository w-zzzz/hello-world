"use client";

import * as React from "react";
import { motion } from "motion/react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import {
  ATTENTION_LAYERS,
  ATTENTION_HEADS,
  SAMPLES,
  getAttention,
  patternName,
} from "@/lib/viz/attention-fixtures";

const CELL = 28;

export function AttentionHeatmap() {
  const [sentenceId, setSentenceId] = React.useState(SAMPLES[2].id);
  const [layer, setLayer] = React.useState(2);
  const [head, setHead] = React.useState(3);
  const [hover, setHover] = React.useState<{ i: number; j: number } | null>(null);

  const sample = SAMPLES.find((s) => s.id === sentenceId)!;
  const tokens = sample.tokens;
  const n = tokens.length;
  const grid = React.useMemo(() => getAttention(sentenceId, layer, head), [sentenceId, layer, head]);

  const W = (n + 1) * CELL + 60 + 60;
  const H = (n + 1) * CELL + 60;
  const rowSums = React.useMemo(() => grid.map((row) => row.reduce((s, v) => s + v, 0)), [grid]);

  return (
    <VizFrame
      title="Attention head viewer"
      subtitle={`L${layer + 1} · H${head + 1} · ${patternName(layer, head)}`}
      onReset={() => { setLayer(0); setHead(0); }}
      fullScreenHref="/playground/attention-heatmap"
    >
      <div className="grid lg:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto bg-[var(--color-muted)]/40 p-5">
          <svg viewBox={`0 0 ${W} ${H}`} className="block min-w-[420px]" style={{ width: "100%", height: "auto" }}>
            {/* col labels */}
            {tokens.map((t, j) => (
              <text
                key={j}
                x={60 + j * CELL + CELL / 2}
                y={40}
                textAnchor="middle"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
                fill="var(--color-muted-fg)"
                transform={`rotate(-45 ${60 + j * CELL + CELL / 2} 40)`}
              >
                {t}
              </text>
            ))}
            {/* row labels */}
            {tokens.map((t, i) => (
              <text
                key={i}
                x={50}
                y={60 + i * CELL + CELL / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
                fill="var(--color-muted-fg)"
              >
                {t}
              </text>
            ))}
            {/* cells */}
            {grid.map((row, i) =>
              row.map((v, j) => {
                const isHover = hover && (hover.i === i || hover.j === j);
                const ts = sentenceId + ":" + layer + ":" + head + ":" + i + ":" + j;
                return (
                  <motion.rect
                    key={ts}
                    x={60 + j * CELL}
                    y={60 + i * CELL}
                    width={CELL - 2}
                    height={CELL - 2}
                    rx={3}
                    fill={cellColor(v)}
                    stroke={isHover ? "var(--color-fg)" : "transparent"}
                    strokeWidth={isHover ? 1.5 : 0}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: j > i ? 0.05 : 1 }}
                    transition={{ duration: 0.25, delay: (i * n + j) * 0.0025 }}
                    onMouseEnter={() => setHover({ i, j })}
                    onMouseLeave={() => setHover((h) => (h?.i === i && h?.j === j ? null : h))}
                  />
                );
              })
            )}
            {/* row-sum verifier bar (right side) */}
            <text x={60 + n * CELL + 10} y={50} fontSize={9} fill="var(--color-muted-fg)" fontFamily="ui-monospace, monospace">
              Σ row
            </text>
            {rowSums.map((s, i) => {
              const barW = Math.min(50, s * 50);
              return (
                <g key={i}>
                  <rect
                    x={60 + n * CELL + 10}
                    y={60 + i * CELL + 4}
                    width={50}
                    height={CELL - 10}
                    fill="var(--color-muted)"
                    rx={2}
                  />
                  <rect
                    x={60 + n * CELL + 10}
                    y={60 + i * CELL + 4}
                    width={barW}
                    height={CELL - 10}
                    fill="var(--color-accent)"
                    rx={2}
                  />
                  <text
                    x={60 + n * CELL + 14}
                    y={60 + i * CELL + CELL / 2 + 3}
                    fontSize={8}
                    fill="white"
                    fontFamily="ui-monospace, monospace"
                  >
                    {s.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-5">
          <Field label="Sentence">
            <select
              value={sentenceId}
              onChange={(e) => setSentenceId(e.target.value)}
              className="w-full rounded-lg border border-soft bg-[var(--color-bg)] px-3 py-1.5 text-sm"
            >
              {SAMPLES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label={`Layer ${layer + 1} of ${ATTENTION_LAYERS}`}>
            <input
              type="range"
              min={0}
              max={ATTENTION_LAYERS - 1}
              value={layer}
              onChange={(e) => setLayer(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <Field label={`Head ${head + 1} of ${ATTENTION_HEADS}`}>
            <input
              type="range"
              min={0}
              max={ATTENTION_HEADS - 1}
              value={head}
              onChange={(e) => setHead(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <div className="rounded-lg border border-soft p-3 text-[11px] text-[var(--color-muted-fg)] leading-relaxed">
            <div className="font-semibold text-[var(--color-fg)] mb-1">Pattern: {patternName(layer, head)}</div>
            Rows are queries; columns are keys. Brighter cells = higher attention weight (post-softmax).
            The upper triangle is masked out (causal).
          </div>
          {hover && (
            <div className="rounded-lg bg-[var(--color-muted)] border border-soft p-3 text-xs">
              <div className="text-[var(--color-muted-fg)]">
                <span className="font-mono">{tokens[hover.i]}</span> → <span className="font-mono">{tokens[hover.j]}</span>
              </div>
              <div className="font-mono mt-1 text-[var(--color-fg)]">
                {grid[hover.i][hover.j].toFixed(3)}
              </div>
            </div>
          )}
          {hover && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-1.5">
                Query <span className="font-mono">{tokens[hover.i]}</span> · key dist.
              </div>
              <div className="space-y-1">
                {grid[hover.i].map((v, j) => (
                  <div key={j} className="flex items-center gap-2 text-[10px] font-mono">
                    <div className="w-12 truncate text-[var(--color-muted-fg)] text-right">{tokens[j]}</div>
                    <div className="flex-1 h-2 rounded bg-[var(--color-muted)] overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${Math.min(100, v * 100)}%`,
                          background: cellColor(v),
                        }}
                      />
                    </div>
                    <div className="w-8 tabular-nums text-[var(--color-fg)] text-right">{v.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--color-muted-fg)] uppercase tracking-[0.16em]">Low</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(to right, oklch(0.35 0.06 280), oklch(0.7 0.18 230), oklch(0.85 0.22 80))" }} />
            <span className="text-[10px] text-[var(--color-muted-fg)] uppercase tracking-[0.16em]">High</span>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function cellColor(v: number) {
  // viridis-like
  const t = Math.max(0, Math.min(1, v));
  const c1 = [55, 25, 90];
  const c2 = [40, 130, 220];
  const c3 = [240, 200, 50];
  let r, g, b;
  if (t < 0.5) {
    const u = t / 0.5;
    r = Math.round(c1[0] * (1 - u) + c2[0] * u);
    g = Math.round(c1[1] * (1 - u) + c2[1] * u);
    b = Math.round(c1[2] * (1 - u) + c2[2] * u);
  } else {
    const u = (t - 0.5) / 0.5;
    r = Math.round(c2[0] * (1 - u) + c3[0] * u);
    g = Math.round(c2[1] * (1 - u) + c3[1] * u);
    b = Math.round(c2[2] * (1 - u) + c3[2] * u);
  }
  return `rgb(${r} ${g} ${b})`;
}
