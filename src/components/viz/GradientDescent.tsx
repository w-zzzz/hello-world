"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, StepForward } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import { cn } from "@/lib/utils";
import {
  LANDSCAPES,
  LANDSCAPE_BY_KEY,
  newOptState,
  step,
  type LossFn,
  type OptKey,
  type OptState,
} from "@/lib/math/landscape";

const W = 720;
const H = 440;

type Trail = Array<{ x: number; y: number; loss: number }>;

export function GradientDescent() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [landscapeKey, setLandscapeKey] = React.useState("rosenbrock");
  const [optKey, setOptKey] = React.useState<OptKey>("adam");
  const [lr, setLr] = React.useState(0.02);
  const [playing, setPlaying] = React.useState(true);
  const [point, setPoint] = React.useState<[number, number] | null>(null);
  const [trail, setTrail] = React.useState<Trail>([]);
  const [optState, setOptState] = React.useState<OptState>(() => newOptState());
  const [stepCount, setStepCount] = React.useState(0);

  const landscape = LANDSCAPE_BY_KEY[landscapeKey] as LossFn;

  React.useEffect(() => {
    setPoint([...landscape.init]);
    setTrail([{ x: landscape.init[0], y: landscape.init[1], loss: landscape.f(...landscape.init) }]);
    setOptState(newOptState());
    setStepCount(0);
  }, [landscape]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;

    const [xmin, xmax, ymin, ymax] = landscape.domain;
    const img = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const x = xmin + (px / W) * (xmax - xmin);
        const y = ymax - (py / H) * (ymax - ymin);
        const v = Math.min(1, Math.log10(1 + Math.max(0, landscape.f(x, y))) / Math.log10(1 + landscape.vmax));
        const [r, g, b] = viridis(1 - v);
        const i = (py * W + px) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [landscape]);

  React.useEffect(() => {
    if (!playing || !point) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 60) {
        last = now;
        const grad = landscape.grad(point[0], point[1]);
        const { delta, state } = step(optKey, optState, grad as [number, number], lr);
        const next: [number, number] = [point[0] + delta[0], point[1] + delta[1]];
        const [xmin, xmax, ymin, ymax] = landscape.domain;
        next[0] = Math.max(xmin + 0.01, Math.min(xmax - 0.01, next[0]));
        next[1] = Math.max(ymin + 0.01, Math.min(ymax - 0.01, next[1]));
        setPoint(next);
        setOptState(state);
        setStepCount((s) => s + 1);
        setTrail((tr) => {
          const t = [...tr, { x: next[0], y: next[1], loss: landscape.f(next[0], next[1]) }];
          return t.length > 250 ? t.slice(-250) : t;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, point, optState, optKey, lr, landscape]);

  function reset() {
    setPoint([...landscape.init]);
    setTrail([{ x: landscape.init[0], y: landscape.init[1], loss: landscape.f(...landscape.init) }]);
    setOptState(newOptState());
    setStepCount(0);
  }

  function singleStep() {
    if (!point) return;
    setPlaying(false);
    const grad = landscape.grad(point[0], point[1]);
    const { delta, state } = step(optKey, optState, grad as [number, number], lr);
    const next: [number, number] = [point[0] + delta[0], point[1] + delta[1]];
    const [xmin, xmax, ymin, ymax] = landscape.domain;
    next[0] = Math.max(xmin + 0.01, Math.min(xmax - 0.01, next[0]));
    next[1] = Math.max(ymin + 0.01, Math.min(ymax - 0.01, next[1]));
    setPoint(next);
    setOptState(state);
    setStepCount((s) => s + 1);
    setTrail((tr) => [...tr, { x: next[0], y: next[1], loss: landscape.f(next[0], next[1]) }]);
  }

  function svgX(x: number) {
    const [xmin, xmax] = landscape.domain;
    return ((x - xmin) / (xmax - xmin)) * W;
  }
  function svgY(y: number) {
    const [, , ymin, ymax] = landscape.domain;
    return ((ymax - y) / (ymax - ymin)) * H;
  }

  function dropAt(e: React.PointerEvent<SVGSVGElement>) {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const [xmin, xmax, ymin, ymax] = landscape.domain;
    const x = xmin + (px / W) * (xmax - xmin);
    const y = ymax - (py / H) * (ymax - ymin);
    setPoint([x, y]);
    setTrail([{ x, y, loss: landscape.f(x, y) }]);
    setOptState(newOptState());
    setStepCount(0);
  }

  const currentLoss = point ? landscape.f(point[0], point[1]) : 0;

  return (
    <VizFrame
      title="Gradient descent playground"
      subtitle={`${landscape.label} · ${optKey.toUpperCase()} · lr ${lr.toFixed(3)}`}
      onReset={reset}
      fullScreenHref="/playground/gradient-descent"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="block w-full h-auto bg-[var(--color-muted)]"
            style={{ aspectRatio: `${W} / ${H}` }}
          />
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            onPointerDown={dropAt}
            onPointerMove={dropAt}
            style={{ cursor: "crosshair" }}
          >
            <defs>
              <marker id="gd-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
              </marker>
            </defs>
            {trail.length > 1 && (
              <polyline
                points={trail.map((p) => `${svgX(p.x)},${svgY(p.y)}`).join(" ")}
                fill="none"
                stroke="white"
                strokeOpacity={0.9}
                strokeWidth={1.5}
              />
            )}
            {point && (() => {
              const [gx, gy] = landscape.grad(point[0], point[1]);
              const mag = Math.hypot(gx, gy) || 1e-9;
              // arrow points along negative gradient (descent direction)
              const dx = -gx / mag;
              const dy = -gy / mag;
              const length = 60;
              const x0 = svgX(point[0]);
              const y0 = svgY(point[1]);
              // svg y is flipped relative to math y; descent on math y = up in pixel
              const x1 = x0 + dx * length;
              const y1 = y0 - dy * length;
              return (
                <line
                  x1={x0}
                  y1={y0}
                  x2={x1}
                  y2={y1}
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  strokeOpacity={0.9}
                  markerEnd="url(#gd-arrow-head)"
                />
              );
            })()}
            {point && (
              <motion.circle
                cx={svgX(point[0])}
                cy={svgY(point[1])}
                r={7}
                fill="white"
                stroke="black"
                strokeWidth={2}
                animate={{ cx: svgX(point[0]), cy: svgY(point[1]) }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
              />
            )}
          </svg>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-5">
          <Field label="Loss surface">
            <select
              aria-label="Loss surface"
              value={landscapeKey}
              onChange={(e) => setLandscapeKey(e.target.value)}
              className="w-full rounded-lg border border-soft bg-[var(--color-bg)] px-3 py-1.5 text-sm"
            >
              {LANDSCAPES.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Optimizer">
            <div className="grid grid-cols-3 gap-1">
              {(["sgd", "momentum", "adam"] as OptKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => { setOptKey(k); setOptState(newOptState()); }}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    optKey === k
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                      : "border-soft bg-[var(--color-bg)] hover:bg-[var(--color-muted)]"
                  )}
                >
                  {k.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Learning rate · ${lr.toFixed(4)}`}>
            <input
              aria-label="Learning rate"
              type="range"
              min={-4}
              max={0}
              step={0.05}
              value={Math.log10(lr)}
              onChange={(e) => setLr(Math.pow(10, +e.target.value))}
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
              Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--color-muted-fg)]">
            <Stat label="Step" value={stepCount.toString()} />
            <Stat label="Loss" value={currentLoss < 1e3 ? currentLoss.toFixed(3) : currentLoss.toExponential(2)} />
          </div>
          <LossSparkline trail={trail} />
          <GradientReadout
            point={point}
            grad={point ? landscape.grad(point[0], point[1]) : null}
          />
          <p className="text-[11px] text-[var(--color-muted-fg)] leading-relaxed">
            Click on the surface to drop the particle. Each landscape has different traps —
            Rosenbrock&apos;s curved valley, Beale&apos;s flat plateaus, Himmelblau&apos;s four minima, the saddle.
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

function LossSparkline({ trail }: { trail: Trail }) {
  if (trail.length < 2) return null;
  const w = 200, h = 48;
  const losses = trail.map((p) => p.loss);
  // Apply log1p so big and small losses are both visible
  const ts = losses.map((v) => Math.log1p(Math.max(0, v)));
  const min = Math.min(...ts);
  const max = Math.max(...ts);
  const span = Math.max(1e-6, max - min);
  const pts = ts
    .map((v, i) => {
      const x = (i / (ts.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-1.5">
        Loss vs step (log)
      </div>
      <div className="rounded-md border border-soft bg-[var(--color-bg)] p-1.5">
        <svg viewBox={`0 0 ${w} ${h}`} className="block w-full h-auto">
          <polyline
            points={pts}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
          />
          <circle
            cx={w}
            cy={(() => {
              const v = ts[ts.length - 1];
              return h - ((v - min) / span) * (h - 4) - 2;
            })()}
            r={2.5}
            fill="var(--color-accent)"
          />
        </svg>
      </div>
    </div>
  );
}

function GradientReadout({
  point,
  grad,
}: {
  point: [number, number] | null;
  grad: [number, number] | null;
}) {
  if (!point || !grad) return null;
  const mag = Math.hypot(grad[0], grad[1]);
  return (
    <div className="rounded-md border border-soft bg-[var(--color-bg)] px-2 py-1.5 text-[10px] font-mono leading-relaxed">
      <div className="text-[var(--color-muted-fg)]">∇L</div>
      <div className="text-[var(--color-fg)]">
        ({grad[0].toFixed(2)}, {grad[1].toFixed(2)}) · ‖∇‖={mag.toFixed(2)}
      </div>
    </div>
  );
}

function viridis(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.min(1, Math.max(0, 0.267 + t * (0.993 - 0.267))));
  const g = Math.round(
    255 * Math.min(1, Math.max(0, 0.005 + t * 0.91 - Math.pow(t - 0.55, 2) * 0.5))
  );
  const b = Math.round(
    255 * Math.min(1, Math.max(0, 0.33 + Math.sin((1 - t) * Math.PI) * 0.55 - t * 0.45))
  );
  return [r, g, b];
}
