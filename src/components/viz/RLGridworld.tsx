"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, StepForward } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import {
  DEFAULT_GRID,
  cellKind,
  makeQ,
  newAgentState,
  qStep,
  getQ,
  type AgentState,
  type QTable,
} from "@/lib/math/qlearning";

const G = DEFAULT_GRID;
const CELL = 56;
const W = G.width * CELL;
const H = G.height * CELL;

export function RLGridworld() {
  const [epsilon, setEpsilon] = React.useState(0.2);
  const [alpha, setAlpha] = React.useState(0.4);
  const [gamma, setGamma] = React.useState(0.95);
  const [playing, setPlaying] = React.useState(true);
  const [speed, setSpeed] = React.useState(60); // ms per step
  const qRef = React.useRef<QTable>(makeQ(G));
  const [state, setState] = React.useState<AgentState>(() => newAgentState(G));
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const tickRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
    }
  }, []);

  React.useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last >= speed) {
        last = now;
        // burst multiple steps per frame for fast learning
        let s = state;
        const burst = Math.max(1, Math.round(8 - speed / 10));
        for (let i = 0; i < burst; i++) {
          s = qStep(qRef.current, G, s, epsilon, alpha, gamma);
        }
        setState(s);
        tickRef.current++;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, epsilon, alpha, gamma, speed, state]);

  // draw
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    // find max |Q| across grid for color scale
    let maxQ = 0.5;
    for (let i = 0; i < qRef.current.length; i++) {
      const v = Math.abs(qRef.current[i]);
      if (v > maxQ) maxQ = v;
    }

    // cells
    for (let y = 0; y < G.height; y++) {
      for (let x = 0; x < G.width; x++) {
        const k = cellKind(G, x, y);
        const px = x * CELL;
        const py = y * CELL;
        // base cell color from value (max Q)
        const qs = getQ(qRef.current, G, x, y);
        const v = Math.max(...qs);
        const t = Math.max(0, Math.min(1, (v + maxQ) / (2 * maxQ)));

        if (k === "lava") {
          ctx.fillStyle = "#7f1d1d";
        } else if (k === "goal") {
          ctx.fillStyle = "#15803d";
        } else if (k === "start") {
          ctx.fillStyle = "#1e3a8a";
        } else {
          // gradient from cool to warm based on max Q
          const r = Math.round(40 + t * 200);
          const g = Math.round(60 + t * 130);
          const b = Math.round(120 - t * 80);
          ctx.fillStyle = `rgb(${r} ${g} ${b})`;
        }
        ctx.fillRect(px, py, CELL, CELL);
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);

        if (k === "goal") {
          ctx.fillStyle = "white";
          ctx.font = "bold 22px ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("★", px + CELL / 2, py + CELL / 2);
        } else if (k === "lava") {
          ctx.fillStyle = "white";
          ctx.font = "bold 18px ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("✖", px + CELL / 2, py + CELL / 2);
        } else if (k === "start") {
          ctx.fillStyle = "white";
          ctx.font = "bold 11px ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("S", px + CELL / 2, py + CELL / 2);
        }

        // q-arrows: 4 directions, opacity scaled by relative value
        if (k === "empty" || k === "start") {
          const arr = qs;
          const min = Math.min(...arr);
          const max = Math.max(...arr);
          const span = Math.max(1e-3, max - min);
          for (let a = 0; a < 4; a++) {
            const norm = (arr[a] - min) / span;
            const opacity = 0.15 + norm * 0.7;
            const len = 8 + norm * 12;
            const cx = px + CELL / 2;
            const cy = py + CELL / 2;
            const dxArrow = a === 1 ? 1 : a === 3 ? -1 : 0;
            const dyArrow = a === 2 ? 1 : a === 0 ? -1 : 0;
            ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + dxArrow * len, cy + dyArrow * len);
            ctx.stroke();
            // small arrowhead
            ctx.fillStyle = `rgba(255,255,255,${opacity})`;
            const hx = cx + dxArrow * len;
            const hy = cy + dyArrow * len;
            ctx.beginPath();
            ctx.arc(hx, hy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // trail
    if (state.trail.length > 1) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < state.trail.length; i++) {
        const [tx, ty] = state.trail[i];
        const cx = tx * CELL + CELL / 2;
        const cy = ty * CELL + CELL / 2;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // agent
    const ax = state.x * CELL + CELL / 2;
    const ay = state.y * CELL + CELL / 2;
    ctx.fillStyle = "#fbbf24";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ax, ay, CELL * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [state]);

  function reset() {
    qRef.current = makeQ(G);
    setState(newAgentState(G));
  }

  function singleStep() {
    setPlaying(false);
    setState((s) => qStep(qRef.current, G, s, epsilon, alpha, gamma));
  }

  return (
    <VizFrame
      title="Q-learning gridworld"
      subtitle={`ep ${state.episode} · steps ${state.steps} · ε=${epsilon.toFixed(2)} · α=${alpha.toFixed(2)} · γ=${gamma.toFixed(2)}`}
      onReset={reset}
      fullScreenHref="/playground/rl-gridworld"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="bg-[var(--color-muted)]/40 grid place-items-center p-4">
          <canvas
            ref={canvasRef}
            className="block max-w-full h-auto rounded-lg border border-soft"
            style={{ width: W, aspectRatio: `${W} / ${H}` }}
          />
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-4">
          <Field label={`ε (explore) · ${epsilon.toFixed(2)}`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={epsilon}
              onChange={(e) => setEpsilon(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <Field label={`α (learning rate) · ${alpha.toFixed(2)}`}>
            <input
              type="range"
              min={0.01}
              max={1}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <Field label={`γ (discount) · ${gamma.toFixed(2)}`}>
            <input
              type="range"
              min={0.5}
              max={0.999}
              step={0.001}
              value={gamma}
              onChange={(e) => setGamma(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <Field label={`Speed · ${speed}ms`}>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-fg)] text-[var(--color-bg)] px-3 py-2 text-xs font-medium"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={singleStep}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-soft px-3 py-2 text-xs font-medium hover:bg-[var(--color-muted)]"
            >
              <StepForward className="h-3.5 w-3.5" />
              Step
            </button>
            <button
              onClick={reset}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-soft px-3 py-2 text-xs font-medium hover:bg-[var(--color-muted)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset agent
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <Stat label="Goals" value={state.successes.toString()} />
            <Stat label="Lava" value={state.failures.toString()} />
          </div>
          <p className="text-[11px] text-[var(--color-muted-fg)] leading-relaxed">
            Each cell shows 4 arrows whose length encodes Q-value per direction. Cell tint is the
            value of its best action — warmer = more reward expected. Yellow circle is the agent.
          </p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-soft px-2 py-1.5">
      <div className="opacity-60 text-[9px] uppercase tracking-[0.14em]">{label}</div>
      <div className="font-mono tabular-nums text-[var(--color-fg)] text-xs">{value}</div>
    </div>
  );
}
