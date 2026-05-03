"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, StepForward, ArrowDownToLine } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";

/** A 2-input MLP with one ReLU hidden unit and squared loss against a target.
 *  We forward through 7 nodes, then backward through them, color-pulsing as
 *  the gradient flows. Algebra is hand-derived so values match exactly. */

type NodeId = "x1" | "x2" | "w1" | "w2" | "z" | "h" | "y" | "L";

const TARGET = 1.0;

type Computed = Record<
  NodeId,
  { v: number; g: number; x: number; y: number; label: string; expr: string }
>;

const layout: Record<NodeId, { x: number; y: number; label: string; expr: string }> = {
  x1: { x: 80, y: 90, label: "x₁", expr: "input" },
  x2: { x: 80, y: 280, label: "x₂", expr: "input" },
  w1: { x: 80, y: 180, label: "w₁", expr: "param" },
  w2: { x: 80, y: 370, label: "w₂", expr: "param" },
  z: { x: 280, y: 185, label: "z", expr: "x₁w₁ + x₂w₂" },
  h: { x: 460, y: 185, label: "h", expr: "ReLU(z)" },
  y: { x: 600, y: 185, label: "ŷ", expr: "h" },
  L: { x: 720, y: 185, label: "L", expr: "(ŷ - t)²" },
};

const edges: Array<[NodeId, NodeId, "fwd" | "bwd"]> = [
  ["x1", "z", "fwd"],
  ["w1", "z", "fwd"],
  ["x2", "z", "fwd"],
  ["w2", "z", "fwd"],
  ["z", "h", "fwd"],
  ["h", "y", "fwd"],
  ["y", "L", "fwd"],
];

function compute(x1 = 1.5, x2 = -0.5, w1 = 0.6, w2 = 0.8): Computed {
  const z = x1 * w1 + x2 * w2;
  const h = Math.max(0, z);
  const yh = h;
  const L = Math.pow(yh - TARGET, 2);

  const dL = 1;
  const dY = 2 * (yh - TARGET);
  const dH = dY * 1; // y = h
  const dZ = h > 0 ? dH * 1 : 0; // ReLU'
  const dW1 = dZ * x1;
  const dX1 = dZ * w1;
  const dW2 = dZ * x2;
  const dX2 = dZ * w2;

  const c: Computed = {
    x1: { ...layout.x1, v: x1, g: dX1 },
    x2: { ...layout.x2, v: x2, g: dX2 },
    w1: { ...layout.w1, v: w1, g: dW1 },
    w2: { ...layout.w2, v: w2, g: dW2 },
    z: { ...layout.z, v: z, g: dZ },
    h: { ...layout.h, v: h, g: dH },
    y: { ...layout.y, v: yh, g: dY },
    L: { ...layout.L, v: L, g: dL },
  };
  return c;
}

const FORWARD_ORDER: NodeId[] = ["x1", "x2", "w1", "w2", "z", "h", "y", "L"];
const BACKWARD_ORDER: NodeId[] = ["L", "y", "h", "z", "w1", "w2", "x1", "x2"];
const TOTAL_STEPS = FORWARD_ORDER.length + BACKWARD_ORDER.length;

export function BackpropStepper() {
  const [step, setStep] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [w1, setW1] = React.useState(0.6);
  const [w2, setW2] = React.useState(0.8);
  const [x1, setX1] = React.useState(1.5);
  const [x2, setX2] = React.useState(-0.5);
  const computed = React.useMemo(() => compute(x1, x2, w1, w2), [x1, x2, w1, w2]);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep((s) => (s + 1) % (TOTAL_STEPS + 4));
    }, 600);
    return () => clearInterval(id);
  }, [playing]);

  const phase: "forward" | "backward" | "idle" =
    step < FORWARD_ORDER.length
      ? "forward"
      : step < FORWARD_ORDER.length + BACKWARD_ORDER.length
        ? "backward"
        : "idle";
  const activeId: NodeId | null =
    phase === "forward"
      ? FORWARD_ORDER[step]
      : phase === "backward"
        ? BACKWARD_ORDER[step - FORWARD_ORDER.length]
        : null;

  function chainExpr(id: NodeId | null): string | null {
    if (!id) return null;
    const c = computed;
    switch (id) {
      case "L":
        return "∂L/∂L = 1";
      case "y":
        return `∂L/∂ŷ = 2(ŷ − t) = ${fmt(c.y.g)}`;
      case "h":
        return `∂L/∂h = ∂L/∂ŷ · ∂ŷ/∂h = ${fmt(c.y.g)} · 1 = ${fmt(c.h.g)}`;
      case "z":
        return `∂L/∂z = ∂L/∂h · ReLU′(z) = ${fmt(c.h.g)} · ${c.z.v > 0 ? 1 : 0} = ${fmt(c.z.g)}`;
      case "w1":
        return `∂L/∂w₁ = ∂L/∂z · x₁ = ${fmt(c.z.g)} · ${fmt(c.x1.v)} = ${fmt(c.w1.g)}`;
      case "w2":
        return `∂L/∂w₂ = ∂L/∂z · x₂ = ${fmt(c.z.g)} · ${fmt(c.x2.v)} = ${fmt(c.w2.g)}`;
      case "x1":
        return `∂L/∂x₁ = ∂L/∂z · w₁ = ${fmt(c.z.g)} · ${fmt(c.w1.v)} = ${fmt(c.x1.g)}`;
      case "x2":
        return `∂L/∂x₂ = ∂L/∂z · w₂ = ${fmt(c.z.g)} · ${fmt(c.w2.v)} = ${fmt(c.x2.g)}`;
    }
  }

  function takeSGDStep() {
    setW1((w) => w - 0.1 * computed.w1.g);
    setW2((w) => w - 0.1 * computed.w2.g);
  }

  return (
    <VizFrame
      title="Backpropagation, step by step"
      subtitle={phase === "forward" ? "Forward pass" : phase === "backward" ? "Backward pass" : "Idle"}
      onReset={() => { setStep(0); setPlaying(false); }}
      fullScreenHref="/playground/backprop-stepper"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="relative bg-[var(--color-muted)] overflow-hidden">
          <svg viewBox="0 0 800 460" className="w-full h-auto block">
            {/* edges */}
            {edges.map(([a, b], i) => {
              const A = computed[a], B = computed[b];
              const isActive =
                (phase === "forward" && (FORWARD_ORDER.indexOf(b) <= step) && (FORWARD_ORDER.indexOf(a) <= step)) ||
                (phase === "backward" && (BACKWARD_ORDER.indexOf(a) <= step - FORWARD_ORDER.length) && (BACKWARD_ORDER.indexOf(b) <= step - FORWARD_ORDER.length));
              return (
                <g key={i}>
                  <path
                    d={`M ${A.x + 28} ${A.y} C ${(A.x + B.x) / 2} ${A.y}, ${(A.x + B.x) / 2} ${B.y}, ${B.x - 28} ${B.y}`}
                    fill="none"
                    stroke={
                      phase === "backward" && isActive
                        ? "rgb(244 63 94)"
                        : phase === "forward" && isActive
                          ? "rgb(56 189 248)"
                          : "var(--color-border)"
                    }
                    strokeOpacity={isActive ? 0.95 : 0.55}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </g>
              );
            })}
            {/* nodes */}
            {(Object.keys(computed) as NodeId[]).map((id) => {
              const n = computed[id];
              const active = activeId === id;
              const reached =
                phase === "forward"
                  ? FORWARD_ORDER.indexOf(id) <= step
                  : phase === "backward"
                    ? BACKWARD_ORDER.indexOf(id) <= step - FORWARD_ORDER.length
                    : true;
              return (
                <motion.g
                  key={id}
                  initial={false}
                  animate={{
                    scale: active ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px`, transformBox: "fill-box" }}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={28}
                    fill={
                      active && phase === "forward"
                        ? "rgb(56 189 248)"
                        : active && phase === "backward"
                          ? "rgb(244 63 94)"
                          : "var(--color-card)"
                    }
                    stroke={reached ? "var(--color-fg)" : "var(--color-border)"}
                    strokeWidth={1.5}
                    opacity={reached ? 1 : 0.6}
                  />
                  <text
                    x={n.x}
                    y={n.y - 2}
                    textAnchor="middle"
                    fontFamily="ui-monospace, monospace"
                    fontSize={14}
                    fontWeight={600}
                    fill={active ? "white" : "var(--color-fg)"}
                  >
                    {n.label}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 12}
                    textAnchor="middle"
                    fontFamily="ui-monospace, monospace"
                    fontSize={9}
                    fill={active ? "white" : "var(--color-muted-fg)"}
                  >
                    {fmt(n.v)}
                  </text>
                  {phase === "backward" && reached && (
                    <text
                      x={n.x}
                      y={n.y + 50}
                      textAnchor="middle"
                      fontFamily="ui-monospace, monospace"
                      fontSize={10}
                      fill="rgb(244 63 94)"
                    >
                      ∂L/∂{n.label.replace("ŷ", "y")}={fmt(n.g)}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </svg>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-fg)] text-[var(--color-bg)] px-3 py-2 text-xs font-medium"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => { setStep((s) => (s + 1) % (TOTAL_STEPS + 4)); setPlaying(false); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-soft px-3 py-2 text-xs font-medium hover:bg-[var(--color-muted)]"
            >
              <StepForward className="h-3.5 w-3.5" />
              Step
            </button>
            <button
              onClick={() => { setStep(0); setPlaying(false); }}
              className="inline-flex items-center justify-center rounded-lg border border-soft px-2 py-2 hover:bg-[var(--color-muted)]"
              aria-label="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <Slider label={`x₁ = ${x1.toFixed(2)}`} ariaLabel="x1 input" min={-2} max={2} value={x1} onChange={setX1} />
          <Slider label={`x₂ = ${x2.toFixed(2)}`} ariaLabel="x2 input" min={-2} max={2} value={x2} onChange={setX2} />
          <Slider label={`w₁ = ${w1.toFixed(2)}`} ariaLabel="w1 weight" min={-2} max={2} value={w1} onChange={setW1} />
          <Slider label={`w₂ = ${w2.toFixed(2)}`} ariaLabel="w2 weight" min={-2} max={2} value={w2} onChange={setW2} />
          {phase === "backward" && activeId && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-[10px] font-mono leading-relaxed text-[var(--color-fg)]">
              {chainExpr(activeId)}
            </div>
          )}
          <button
            onClick={takeSGDStep}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-soft bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 px-3 py-2 text-xs font-medium text-[var(--color-fg)]"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Take SGD step (lr=0.1)
          </button>
          <div className="rounded-lg border border-soft p-3 text-[11px] text-[var(--color-muted-fg)] leading-relaxed">
            Forward (blue) pulses values toward the loss. Backward (rose) pulses ∂L/∂· back through the graph.
            Target t = {TARGET.toFixed(1)}. Loss = {fmt(computed.L.v)}.
          </div>
        </div>
      </div>
    </VizFrame>
  );
}

function Slider({
  label,
  ariaLabel,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  /** Plain-text fallback used as aria-label since `label` may include math
   *  symbols/values that don't read well with assistive tech. */
  ariaLabel?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-1.5">
        {label}
      </div>
      <input
        aria-label={ariaLabel ?? label}
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  );
}

function fmt(n: number) {
  if (Math.abs(n) >= 100) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(2);
}
