"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import { cn } from "@/lib/utils";

const NUM_EXPERTS = 8;
const SAMPLE_SENTENCES = [
  "The cat sat on the mat",
  "Attention is all you need",
  "transformers learn long range patterns",
  "machine learning model trains on data",
  "deep neural networks scale with compute",
  "diffusion generates images from noise",
  "language models predict the next token",
  "reinforcement learning rewards good actions",
];

function hashStr(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0xfffffff;
  return h;
}

/** Per-token routing affinity. Returns a softmax-ish distribution over experts.
 *  When balanced=false, we collapse routing toward 1-2 experts to demonstrate
 *  load imbalance. */
function routeToken(tok: string, balanced: boolean): number[] {
  const h = hashStr(tok.toLowerCase());
  const logits = new Array(NUM_EXPERTS).fill(0);
  for (let i = 0; i < NUM_EXPERTS; i++) {
    const v = ((h >> (i * 3)) & 0xff) / 255;
    logits[i] = balanced
      ? v + Math.sin(h * 0.001 + i) * 0.5
      : (i === (h % 2 === 0 ? 0 : 1) ? 5 : v * 0.3); // collapse to expert 0 or 1
  }
  const max = Math.max(...logits);
  const exp = logits.map((v) => Math.exp(v - max));
  const s = exp.reduce((a, b) => a + b, 0);
  return exp.map((v) => v / s);
}

function topK(arr: number[], k: number): number[] {
  return arr
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, k)
    .map((x) => x.i);
}

type Stream = {
  id: number;
  word: string;
  startedAt: number;
  experts: number[];
  weights: number[];
};

const SVG_W = 720;
const SVG_H = 360;

export function MoERouterViz() {
  const [balanced, setBalanced] = React.useState(true);
  const [playing, setPlaying] = React.useState(true);
  const [streams, setStreams] = React.useState<Stream[]>([]);
  const [counts, setCounts] = React.useState<number[]>(() => new Array(NUM_EXPERTS).fill(0));
  const [seqIdx, setSeqIdx] = React.useState(0);
  const idCounter = React.useRef(0);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
    }
  }, []);

  React.useEffect(() => {
    if (!playing) return;
    let cancel = false;
    const tick = () => {
      if (cancel) return;
      const sentence = SAMPLE_SENTENCES[seqIdx % SAMPLE_SENTENCES.length];
      const words = sentence.split(/\s+/);
      let i = 0;
      const send = () => {
        if (cancel || i >= words.length) {
          setSeqIdx((s) => s + 1);
          setTimeout(tick, 700);
          return;
        }
        const w = words[i];
        const dist = routeToken(w, balanced);
        const top = topK(dist, 2);
        const id = ++idCounter.current;
        setStreams((prev) => [
          ...prev,
          { id, word: w, startedAt: performance.now(), experts: top, weights: top.map((e) => dist[e]) },
        ]);
        setCounts((prev) => {
          const next = [...prev];
          for (const e of top) next[e]++;
          return next;
        });
        i++;
        setTimeout(send, 380);
      };
      send();
    };
    tick();
    return () => { cancel = true; };
  }, [playing, balanced, seqIdx]);

  // garbage-collect old streams
  React.useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      setStreams((prev) => prev.filter((s) => now - s.startedAt < 2400));
    }, 400);
    return () => clearInterval(id);
  }, []);

  function reset() {
    setStreams([]);
    setCounts(new Array(NUM_EXPERTS).fill(0));
    setSeqIdx(0);
  }

  // expert column geometry
  const expertX = SVG_W - 110;
  const laneSpacing = 30;
  const laneTop = 30;
  function laneY(i: number) { return laneTop + i * laneSpacing; }
  const sourceX = 40;
  const sourceY = SVG_H / 2 - 20;
  const maxCount = Math.max(1, ...counts);

  return (
    <VizFrame
      title="Mixture-of-Experts router"
      subtitle={`${NUM_EXPERTS} experts · top-2 routing · ${balanced ? "balanced" : "collapsed"}`}
      onReset={reset}
      fullScreenHref="/playground/moe-router"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="bg-[var(--color-muted)]/40">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block w-full h-auto">
            {/* token source */}
            <rect x={sourceX - 22} y={sourceY - 14} width={44} height={28} rx={6} fill="var(--color-card)" stroke="var(--color-border)" />
            <text x={sourceX} y={sourceY + 4} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill="var(--color-muted-fg)">
              tokens
            </text>
            {/* expert lanes */}
            {Array.from({ length: NUM_EXPERTS }).map((_, i) => (
              <g key={i}>
                <line x1={sourceX + 28} y1={laneY(i)} x2={expertX - 6} y2={laneY(i)} stroke="var(--color-border)" strokeOpacity={0.35} strokeDasharray="3 3" />
                <rect x={expertX} y={laneY(i) - 11} width={88} height={22} rx={5} fill="var(--color-card)" stroke="var(--color-border)" />
                <text x={expertX + 44} y={laneY(i) + 3} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, monospace" fill="var(--color-fg)">
                  expert {i}
                </text>
              </g>
            ))}
            {/* token streams */}
            <AnimatePresence>
              {streams.map((s) => (
                <g key={s.id}>
                  {s.experts.map((e, k) => {
                    const wt = s.weights[k];
                    return (
                      <motion.line
                        key={k}
                        initial={{
                          x1: sourceX + 28,
                          y1: sourceY,
                          x2: sourceX + 28,
                          y2: sourceY,
                          opacity: 0,
                        }}
                        animate={{
                          x1: sourceX + 28,
                          y1: sourceY,
                          x2: expertX - 6,
                          y2: laneY(e),
                          opacity: 0.55 + wt * 0.4,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
                        stroke={k === 0 ? "var(--color-accent)" : "var(--color-fg)"}
                        strokeWidth={1 + wt * 2}
                        strokeOpacity={0.7}
                      />
                    );
                  })}
                  {/* token chip moving */}
                  <motion.g
                    initial={{ x: sourceX + 28, y: sourceY }}
                    animate={{ x: expertX - 6, y: laneY(s.experts[0]) }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                  >
                    <rect x={-22} y={-9} width={44} height={18} rx={4} fill="var(--color-accent)" opacity={0.85} />
                    <text x={0} y={3} textAnchor="middle" fontSize={9} fontFamily="ui-monospace, monospace" fill="var(--color-accent-fg)">
                      {s.word.slice(0, 8)}
                    </text>
                  </motion.g>
                </g>
              ))}
            </AnimatePresence>
            {/* expert load bars */}
            {counts.map((c, i) => {
              const w = (c / maxCount) * 38;
              return (
                <rect key={i} x={expertX + 88 + 4} y={laneY(i) - 5} width={w} height={10} rx={2} fill="var(--color-accent)" opacity={0.55} />
              );
            })}
          </svg>
          {/* expert load chart */}
          <div className="px-5 pb-5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-2">
              Expert load (cumulative)
            </div>
            <div className="grid grid-cols-8 gap-1 items-end" style={{ height: 56 }}>
              {counts.map((c, i) => {
                const h = (c / Math.max(1, maxCount)) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${h}%`,
                        background: balanced ? "var(--color-accent)" : "rgb(244 63 94)",
                        opacity: 0.85,
                      }}
                      title={`expert ${i}: ${c} tokens`}
                    />
                    <div className="text-[8px] font-mono tabular-nums text-[var(--color-muted-fg)]">
                      {c}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-1.5">
              Load balancing
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => { setBalanced(true); reset(); }}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  balanced
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                    : "border-soft hover:bg-[var(--color-muted)]"
                )}
              >
                Balanced
              </button>
              <button
                onClick={() => { setBalanced(false); reset(); }}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  !balanced
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-soft hover:bg-[var(--color-muted)]"
                )}
              >
                Off (collapsed)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-fg)] text-[var(--color-bg)] px-3 py-2 text-xs font-medium"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-soft px-3 py-2 text-xs font-medium hover:bg-[var(--color-muted)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
          <div className="text-[11px] text-[var(--color-muted-fg)] leading-relaxed">
            Each token picks its top-2 experts by routing affinity. With load balancing on, all
            experts see roughly even traffic. Turn it off and tokens collapse onto experts 0/1,
            wasting parameters and hurting throughput.
          </div>
          <div className="rounded-md border border-soft px-2 py-1.5 text-[11px]">
            <div className="text-[var(--color-muted-fg)] uppercase tracking-[0.14em] text-[9px]">Total routed</div>
            <div className="font-mono text-[var(--color-fg)] tabular-nums">{counts.reduce((a, b) => a + b, 0)}</div>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}
