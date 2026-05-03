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

type ImageKey = "donut" | "stripes" | "moon" | "mlmap";

function rasterText(text: string, w = SIZE, h = SIZE): Uint8Array {
  if (typeof document === "undefined") return new Uint8Array(w * h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const out = new Uint8Array(w * h);
  if (!ctx) return out;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "white";
  ctx.font = `bold ${Math.round(h * 0.34)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const px = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < w * h; i++) out[i] = px[i * 4] > 128 ? 1 : 0;
  return out;
}

function targetImage(kind: ImageKey, w = SIZE, h = SIZE): Float32Array {
  const data = new Float32Array(w * h * 3);
  const textMask = kind === "mlmap" ? rasterText("MLMap", w, h) : null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w - 0.5;
      const v = y / h - 0.5;
      let r = 0, g = 0, b = 0;
      if (kind === "mlmap") {
        const m = textMask ? textMask[y * w + x] : 0;
        // gradient inside text glyphs
        r = m ? 0.95 : 0.05;
        g = m ? 0.65 + u * 0.6 : 0.05;
        b = m ? 0.95 - v * 0.5 : 0.1;
      } else if (kind === "donut") {
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
  const [showSchedule, setShowSchedule] = React.useState(false);
  const noiseRef = React.useRef<Float32Array | null>(null);
  const targetRef = React.useRef<Float32Array | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const noiseInsetRef = React.useRef<HTMLCanvasElement>(null);

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
    // noise-prediction inset: target − current ≈ predicted ε direction
    const inset = noiseInsetRef.current;
    if (inset) {
      inset.width = SIZE;
      inset.height = SIZE;
      const ictx = inset.getContext("2d");
      if (ictx) {
        const iimg = ictx.createImageData(SIZE, SIZE);
        for (let i = 0; i < SIZE * SIZE; i++) {
          const cr = Math.max(0, Math.min(1, sa * target[i * 3] + sb * (noise[i * 3] * 0.4 + 0.5)));
          const cg = Math.max(0, Math.min(1, sa * target[i * 3 + 1] + sb * (noise[i * 3 + 1] * 0.4 + 0.5)));
          const cb = Math.max(0, Math.min(1, sa * target[i * 3 + 2] + sb * (noise[i * 3 + 2] * 0.4 + 0.5)));
          // visualize |target − current| amplified
          const dr = Math.min(1, Math.abs(target[i * 3] - cr) * 2);
          const dg = Math.min(1, Math.abs(target[i * 3 + 1] - cg) * 2);
          const db = Math.min(1, Math.abs(target[i * 3 + 2] - cb) * 2);
          const k = i * 4;
          iimg.data[k] = Math.round(dr * 255);
          iimg.data[k + 1] = Math.round(dg * 255);
          iimg.data[k + 2] = Math.round(db * 255);
          iimg.data[k + 3] = 255;
        }
        ictx.putImageData(iimg, 0, 0);
      }
    }
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
        <div className="grid place-items-center bg-[var(--color-muted)]/40 p-6 relative">
          <div className="rounded-2xl border border-soft overflow-hidden shadow-2xl shadow-black/10" style={{ width: SIZE * 1.6, maxWidth: "100%" }}>
            <canvas ref={canvasRef} className="block w-full h-auto" style={{ aspectRatio: "1/1", imageRendering: "pixelated" }} />
          </div>
          {/* noise-prediction inset */}
          <div className="absolute bottom-3 right-3 rounded-lg border border-soft overflow-hidden shadow-lg" style={{ width: 88 }}>
            <div className="bg-[var(--color-card)] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[var(--color-muted-fg)]">
              ε̂ (target − current)
            </div>
            <canvas ref={noiseInsetRef} className="block w-full h-auto" style={{ aspectRatio: "1/1", imageRendering: "pixelated" }} />
          </div>
          {showSchedule && <BetaScheduleOverlay t={t} T={T} />}
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-4">
          <Field label="Target image">
            <div className="grid grid-cols-2 gap-1">
              {(["donut", "stripes", "moon", "mlmap"] as ImageKey[]).map((k) => (
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
          <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSchedule}
              onChange={(e) => setShowSchedule(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <span className="text-[var(--color-fg)]">Show β schedule overlay</span>
          </label>
          <Field label={`Timestep · ${t}/${T}`}>
            <input
              aria-label="Timestep"
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

function BetaScheduleOverlay({ t, T: tot }: { t: number; T: number }) {
  const w = 200, h = 80;
  const samples = 80;
  // ᾱ vs t (cosine schedule)
  const ptsA = Array.from({ length: samples + 1 }, (_, i) => {
    const tt = (i / samples) * tot;
    const ab = alphaBar(tt, tot);
    return [(i / samples) * w, h - ab * (h - 6) - 3] as const;
  })
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  // current marker
  const cx = ((tot - t) / tot) * w;
  const cy = h - alphaBar(t, tot) * (h - 6) - 3;
  return (
    <div className="absolute top-3 left-3 rounded-lg border border-soft bg-[var(--color-card)]/95 backdrop-blur p-2 shadow-lg" style={{ width: w + 16 }}>
      <div className="text-[8px] uppercase tracking-[0.14em] text-[var(--color-muted-fg)] mb-1">
        ᾱ schedule (cosine)
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="block w-full h-auto">
        <polyline points={ptsA} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} />
        <line x1={cx} y1={0} x2={cx} y2={h} stroke="var(--color-fg)" strokeWidth={0.7} strokeOpacity={0.5} strokeDasharray="2 2" />
        <circle cx={cx} cy={cy} r={3} fill="var(--color-fg)" />
      </svg>
    </div>
  );
}
