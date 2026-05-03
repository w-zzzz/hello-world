"use client";

import * as React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import { cn } from "@/lib/utils";

/** A tiny 2D-input MLP that learns to classify {circle, xor, spiral, two-moons}.
 *  Pure JS forward + backprop in this file (no TF/PyTorch). The decision
 *  surface is rendered into a canvas every few RAFs by sampling a 60×60 grid. */

type Activation = "relu" | "tanh" | "sigmoid";
type DatasetKey = "xor" | "circle" | "spiral" | "moons";

const RES = 80;
const W = 480;
const H = 360;

function genData(kind: DatasetKey, n = 240): { x: [number, number][]; y: number[] } {
  const x: [number, number][] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    if (kind === "xor") {
      const a = (Math.random() < 0.5 ? -1 : 1) * 0.6 + (Math.random() - 0.5) * 0.5;
      const b = (Math.random() < 0.5 ? -1 : 1) * 0.6 + (Math.random() - 0.5) * 0.5;
      x.push([a, b]);
      y.push(a * b > 0 ? 1 : 0);
    } else if (kind === "circle") {
      const r = Math.random();
      const t = Math.random() * Math.PI * 2;
      const a = (r * 1.6) * Math.cos(t);
      const b = (r * 1.6) * Math.sin(t);
      x.push([a, b]);
      y.push(r < 0.5 ? 1 : 0);
    } else if (kind === "spiral") {
      const c = i % 2;
      const t = (i / n) * 2.5 * Math.PI + (c ? Math.PI : 0);
      const r = (i / n) * 1.6 + 0.3;
      const a = r * Math.cos(t) + (Math.random() - 0.5) * 0.1;
      const b = r * Math.sin(t) + (Math.random() - 0.5) * 0.1;
      x.push([a, b]);
      y.push(c);
    } else {
      // two moons
      const c = i % 2;
      const t = (i / n) * Math.PI;
      const a = Math.cos(t) * 1.2 + (c ? 0.6 : -0.6) + (Math.random() - 0.5) * 0.15;
      const b = Math.sin(t) * 0.7 * (c ? -1 : 1) + (c ? -0.3 : 0.3) + (Math.random() - 0.5) * 0.15;
      x.push([a, b]);
      y.push(c);
    }
  }
  return { x, y };
}

type Layer = { W: number[][]; b: number[]; act: Activation };

function makeMLP(sizes: number[], act: Activation): Layer[] {
  const layers: Layer[] = [];
  for (let i = 1; i < sizes.length; i++) {
    const fanIn = sizes[i - 1];
    const fanOut = sizes[i];
    const std = Math.sqrt(2 / fanIn);
    const W = Array.from({ length: fanOut }, () =>
      Array.from({ length: fanIn }, () => randn() * std)
    );
    const b = Array.from({ length: fanOut }, () => 0);
    layers.push({ W, b, act: i === sizes.length - 1 ? "sigmoid" : act });
  }
  return layers;
}

function randn() {
  const u = Math.random() || 1e-9;
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function applyAct(z: number[], act: Activation): number[] {
  if (act === "relu") return z.map((v) => Math.max(0, v));
  if (act === "tanh") return z.map(Math.tanh);
  return z.map((v) => 1 / (1 + Math.exp(-v)));
}

function dAct(a: number, act: Activation): number {
  if (act === "relu") return a > 0 ? 1 : 0;
  if (act === "tanh") return 1 - a * a;
  return a * (1 - a);
}

function forward(layers: Layer[], x: number[]): { acts: number[][]; preActs: number[][] } {
  let a = x;
  const acts: number[][] = [a];
  const preActs: number[][] = [];
  for (const L of layers) {
    const z = L.W.map((row, i) => row.reduce((s, w, j) => s + w * a[j], L.b[i]));
    preActs.push(z);
    a = applyAct(z, L.act);
    acts.push(a);
  }
  return { acts, preActs };
}

function trainStep(layers: Layer[], xs: [number, number][], ys: number[], lr: number): number {
  let lossTotal = 0;
  // gradients
  const gW = layers.map((L) => L.W.map((row) => row.map(() => 0)));
  const gB = layers.map((L) => L.b.map(() => 0));

  for (let n = 0; n < xs.length; n++) {
    const { acts } = forward(layers, xs[n]);
    const yhat = acts[acts.length - 1][0];
    const t = ys[n];
    const eps = 1e-7;
    lossTotal += -(t * Math.log(yhat + eps) + (1 - t) * Math.log(1 - yhat + eps));

    // delta on output layer (sigmoid + BCE)
    let delta: number[] = [yhat - t];
    for (let l = layers.length - 1; l >= 0; l--) {
      const L = layers[l];
      const aPrev = acts[l]; // activations into this layer
      // accumulate grads
      for (let i = 0; i < L.W.length; i++) {
        for (let j = 0; j < L.W[i].length; j++) {
          gW[l][i][j] += delta[i] * aPrev[j];
        }
        gB[l][i] += delta[i];
      }
      if (l > 0) {
        const newDelta: number[] = Array(layers[l - 1].W.length).fill(0);
        for (let j = 0; j < newDelta.length; j++) {
          let s = 0;
          for (let i = 0; i < L.W.length; i++) s += L.W[i][j] * delta[i];
          newDelta[j] = s * dAct(acts[l][j], layers[l - 1].act);
          // careful: need derivative wrt previous layer's activation
        }
        // The previous block uses the wrong index for activation; simpler: reuse the formula
        // delta_{l-1, j} = (sum_i W_{l,i,j} * delta_{l,i}) * dAct(a_{l-1, j}, act_{l-1})
        // Using a_{l-1, j} = acts[l][j]? No: acts has length L+1. acts[0]=input, acts[L]=output.
        // So activation of layer l-1 is acts[l]. That's what we have.
        delta = newDelta;
      }
    }
  }
  // SGD update
  const N = xs.length;
  for (let l = 0; l < layers.length; l++) {
    for (let i = 0; i < layers[l].W.length; i++) {
      for (let j = 0; j < layers[l].W[i].length; j++) {
        layers[l].W[i][j] -= (lr * gW[l][i][j]) / N;
      }
      layers[l].b[i] -= (lr * gB[l][i]) / N;
    }
  }
  return lossTotal / N;
}

export function NNPlayground() {
  const [dataset, setDataset] = React.useState<DatasetKey>("xor");
  const [hidden, setHidden] = React.useState(2);
  const [act, setAct] = React.useState<Activation>("relu");
  const [lr, setLr] = React.useState(0.1);
  const [playing, setPlaying] = React.useState(true);
  const [step, setStep] = React.useState(0);
  const [loss, setLoss] = React.useState<number>(1);
  const dataRef = React.useRef(genData(dataset));
  const layersRef = React.useRef<Layer[]>(makeMLP([2, 6, 1], act));
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Re-init on dataset/architecture/activation change
  React.useEffect(() => {
    dataRef.current = genData(dataset);
    const sizes = [2, ...Array(hidden).fill(6), 1];
    layersRef.current = makeMLP(sizes, act);
    setStep(0);
  }, [dataset, hidden, act]);

  // train loop
  React.useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 24) {
        last = now;
        const l = trainStep(layersRef.current, dataRef.current.x, dataRef.current.y, lr);
        setLoss(l);
        setStep((s) => s + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, lr, dataset, hidden, act]);

  // render decision surface
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;
    const img = ctx.createImageData(W, H);
    const cell = W / RES;
    for (let py = 0; py < RES; py++) {
      for (let px = 0; px < RES; px++) {
        const x = (px / RES) * 4 - 2;
        const y = (py / RES) * 3 - 1.5;
        const { acts } = forward(layersRef.current, [x, y]);
        const p = acts[acts.length - 1][0];
        const r = Math.round(255 * (1 - p));
        const g = Math.round(160 * Math.abs(p - 0.5) * 2);
        const b = Math.round(255 * p);
        // fill cell rectangle
        const x0 = Math.floor(px * cell);
        const y0 = Math.floor(py * (H / RES));
        const x1 = Math.floor((px + 1) * cell);
        const y1 = Math.floor((py + 1) * (H / RES));
        for (let yy = y0; yy < y1; yy++) {
          for (let xx = x0; xx < x1; xx++) {
            const i = (yy * W + xx) * 4;
            img.data[i] = r;
            img.data[i + 1] = g;
            img.data[i + 2] = b;
            img.data[i + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    // overlay points
    ctx.globalAlpha = 0.95;
    for (let i = 0; i < dataRef.current.x.length; i++) {
      const [a, b] = dataRef.current.x[i];
      const px = ((a + 2) / 4) * W;
      const py = ((b + 1.5) / 3) * H;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = dataRef.current.y[i] === 1 ? "#0a8" : "#f3a";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [step, dataset, hidden, act]);

  function reset() {
    dataRef.current = genData(dataset);
    const sizes = [2, ...Array(hidden).fill(6), 1];
    layersRef.current = makeMLP(sizes, act);
    setStep(0);
    setLoss(1);
  }

  return (
    <VizFrame
      title="Neural network playground"
      subtitle={`${dataset} · ${hidden} hidden · ${act} · lr ${lr.toFixed(2)}`}
      onReset={reset}
      fullScreenHref="/playground/nn-playground"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="bg-[var(--color-muted)]/40">
          <canvas ref={canvasRef} className="block w-full h-auto" style={{ aspectRatio: `${W}/${H}` }} />
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-4">
          <Field label="Dataset">
            <div className="grid grid-cols-2 gap-1">
              {(["xor", "circle", "spiral", "moons"] as DatasetKey[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDataset(d)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    dataset === d
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                      : "border-soft bg-[var(--color-bg)] hover:bg-[var(--color-muted)]"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Activation">
            <div className="grid grid-cols-3 gap-1">
              {(["relu", "tanh", "sigmoid"] as Activation[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAct(a)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    act === a
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                      : "border-soft bg-[var(--color-bg)] hover:bg-[var(--color-muted)]"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Hidden layers · ${hidden}`}>
            <input type="range" min={1} max={4} step={1} value={hidden} onChange={(e) => setHidden(+e.target.value)} className="w-full accent-[var(--color-accent)]" />
          </Field>
          <Field label={`Learning rate · ${lr.toFixed(2)}`}>
            <input type="range" min={0.01} max={1} step={0.01} value={lr} onChange={(e) => setLr(+e.target.value)} className="w-full accent-[var(--color-accent)]" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPlaying((p) => !p)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-fg)] text-[var(--color-bg)] px-3 py-2 text-xs font-medium">
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button onClick={reset} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-soft px-3 py-2 text-xs font-medium hover:bg-[var(--color-muted)]">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-md border border-soft px-2 py-1.5">
              <div className="opacity-60 text-[9px] uppercase tracking-[0.14em]">Step</div>
              <div className="font-mono tabular-nums text-xs">{step}</div>
            </div>
            <div className="rounded-md border border-soft px-2 py-1.5">
              <div className="opacity-60 text-[9px] uppercase tracking-[0.14em]">Loss</div>
              <div className="font-mono tabular-nums text-xs">{loss.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>
    </VizFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-fg)] font-medium mb-1.5">{label}</div>
      {children}
    </div>
  );
}
