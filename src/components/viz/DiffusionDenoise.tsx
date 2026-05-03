"use client";

import * as React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import { cn } from "@/lib/utils";

/** A procedural diffusion denoising visualization.
 *  We start from a target "image" (gradient + shape), add Gaussian noise per
 *  the variance schedule, then visualize the reverse process by interpolating
 *  back. This is a simulation not a real model — but it teaches the structure:
 *  noisy → less-noisy → clean over T steps with a chosen β schedule. */

const SIZE = 192;
const T = 60;

type ImageKey = "donut" | "stripes" | "moon";

function targetImage(kind: ImageKey, w = SIZE, h = SIZE): Float32Array {
  const data = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w - 0.5;
      const v = y / h - 0.5;
      let r = 0, g = 0, b = 0;
      if (kind === "donut") {
        const dist = Math.sqrt(u * u + v * v);
        const inRing = dist > 0.18 && dist < 0.36;
        r = inRing ? 1 : 0.06;
        g = inRing ? 0.5 + (1 - dist) * 0.4 : 0.05;
        b = inRing ? 0.2 : 0.1;
      } else if (kind === "stripes") {
        const phase = (Math.atan2(v, u) + Math.PI) / (Math.PI * 2);
        const dist = Math.sqrt(u * u + v * v);
        const stripe = Math.sin(phase * 16) > 0 ? 1 : 0;
        r = stripe * (1 - dist * 1.4) + 0.05;
        g = (1 - stripe) * (1 - dist * 1.2) + 0.05;
        b = 0.5 + 0.4 * Math.sin(phase * 8);
      } else {
        // moon: bright disc with subtractive disc
        const d = Math.sqrt(u * u + v * v);
        const dx = u - 0.1, dy = v - 0.05;
        const d2 = Math.sqrt(dx * dx + dy * dy);
        const mask = d < 0.3 && d2 > 0.18 ? 1 : 0;
        r = 0.95 * mask + 0.05;
        g = 0.93 * mask + 0.05;
        b = 0.82 * mask + 0.1;
      }
      const i = (y * w + x) * 3;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
  return data;
}

function gaussNoise(n: number, scale = 1) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 2) {
    const u = Math.random() || 1e-9;
    const v = Math.random();
    const r = Math.sqrt(-2 * Math.log(u));
    out[i] = r * Math.cos(2 * Math.PI * v) * scale;
    if (i + 1 < n) out[i + 1] = r * Math.sin(2 * Math.PI * v) * scale;
  }
  return out;
}

/** Reverse process: at step t (T..0), the displayed image is sqrt(αbar_t) * x0 + sqrt(1-αbar_t) * ε
 *  with smaller t → cleaner. */
function alphaBar(t: number, T: number): number {
  // cosine schedule clipped
  const s = 0.008;
  const f = (u: number) => Math.pow(Math.cos(((u / T) + s) / (1 + s) * Math.PI / 2), 2);
  return Math.max(1e-4, Math.min(0.9999, f(t) / f(0)));
}

export function DiffusionDenoise() {
  const [kind, setKind] = React.useState<ImageKey>("donut");
  const [t, setT] = React.useState(T);
  const [playing, setPlaying] = React.useState(true);
  const noiseRef = React.useRef<Float32Array | null>(null);
  const targetRef = React.useRef<Float32Array | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    targetRef.current = targetImage(kind);
    noiseRef.current = gaussNoise(SIZE * SIZE * 3);
    setT(T);
  }, [kind]);

  React.useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 90) {
        last = now;
        setT((cur) => (cur > 0 ? cur - 1 : T));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const target = targetRef.current!;
    const noise = noiseRef.current!;
    const ab = alphaBar(t, T);
    const sa = Math.sqrt(ab);
    const sb = Math.sqrt(1 - ab);
    const img = ctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const r = Math.max(0, Math.min(1, sa * target[i * 3] + sb * (noise[i * 3] * 0.4 + 0.5)));
      const g = Math.max(0, Math.min(1, sa * target[i * 3 + 1] + sb * (noise[i * 3 + 1] * 0.4 + 0.5)));
      const b = Math.max(0, Math.min(1, sa * target[i * 3 + 2] + sb * (noise[i * 3 + 2] * 0.4 + 0.5)));
      const k = i * 4;
      img.data[k] = Math.round(r * 255);
      img.data[k + 1] = Math.round(g * 255);
      img.data[k + 2] = Math.round(b * 255);
      img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [t, kind]);

  function reset() {
    setT(T);
    noiseRef.current = gaussNoise(SIZE * SIZE * 3);
  }

  return (
    <VizFrame
      title="Diffusion denoising"
      subtitle={`step ${T - t} of ${T} · ᾱ = ${alphaBar(t, T).toFixed(3)}`}
      onReset={reset}
      fullScreenHref="/playground/diffusion-denoise"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="grid place-items-center bg-[var(--color-muted)]/40 p-8">
          <div className="rounded-2xl border border-soft overflow-hidden shadow-2xl shadow-black/10" style={{ width: SIZE * 1.6, maxWidth: "100%" }}>
            <canvas ref={canvasRef} className="block w-full h-auto" style={{ aspectRatio: "1/1", imageRendering: "pixelated" }} />
          </div>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-4">
          <Field label="Target image">
            <div className="grid grid-cols-3 gap-1">
              {(["donut", "stripes", "moon"] as ImageKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    kind === k
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                      : "border-soft bg-[var(--color-bg)] hover:bg-[var(--color-muted)]"
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Timestep · ${t}/${T}`}>
            <input
              type="range"
              min={0}
              max={T}
              value={t}
              onChange={(e) => { setT(+e.target.value); setPlaying(false); }}
              className="w-full accent-[var(--color-accent)]"
            />
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
          <div className="rounded-lg border border-soft p-3 text-[11px] leading-relaxed text-[var(--color-muted-fg)]">
            Forward process adds Gaussian noise per a cosine β schedule. Reverse process (here:
            interpolating along ᾱ) walks the timestep back to <span className="font-mono">t = 0</span>,
            recovering the target. Real diffusion learns ε at each step; this demo plays back the
            ground-truth ε to show structure.
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
