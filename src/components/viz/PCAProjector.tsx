"use client";

import * as React from "react";
import { VizFrame } from "@/components/viz/shared/VizFrame";
import {
  sampleGaussian2D,
  meanCov,
  eig2,
  projectAndVariance,
  type Vec2,
} from "@/lib/math/pca";

const W = 540;
const H = 420;
const PAD = 36;

export function PCAProjector() {
  const [rho, setRho] = React.useState(0.7);
  const [theta, setTheta] = React.useState(0.6);
  const [n, setN] = React.useState(200);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const points: Vec2[] = React.useMemo(() => sampleGaussian2D(n, 1.6, 0.8, rho), [n, rho]);
  const { mean, cov } = React.useMemo(() => meanCov(points), [points]);
  const { vals, vecs } = React.useMemo(() => eig2(cov), [cov]);
  const totalVar = vals[0] + vals[1];
  const principalTheta = Math.atan2(vecs[0][1], vecs[0][0]);
  const { variance: projVar } = React.useMemo(
    () => projectAndVariance(points, theta),
    [points, theta]
  );
  const projFraction = totalVar > 1e-9 ? projVar / totalVar : 0;

  // domain centered on mean
  const xRange = 4.0;
  const yRange = (xRange * H) / W;
  function px(x: number) {
    return ((x - mean[0]) / xRange + 0.5) * (W - PAD * 2) + PAD;
  }
  function py(y: number) {
    return (-((y - mean[1]) / yRange) + 0.5) * (H - PAD * 2) + PAD;
  }

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;
    // background
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.clearRect(0, 0, W, H);
    // grid
    ctx.strokeStyle = "rgba(127,127,127,0.18)";
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      const x = px(i);
      ctx.beginPath();
      ctx.moveTo(x, PAD);
      ctx.lineTo(x, H - PAD);
      ctx.stroke();
      const y = py(i);
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
    }
    // axes
    ctx.strokeStyle = "rgba(127,127,127,0.55)";
    ctx.beginPath();
    ctx.moveTo(PAD, py(0));
    ctx.lineTo(W - PAD, py(0));
    ctx.moveTo(px(0), PAD);
    ctx.lineTo(px(0), H - PAD);
    ctx.stroke();

    // projection axis (full extent)
    const cx = Math.cos(theta), cy = Math.sin(theta);
    const axisLen = 3.5;
    ctx.strokeStyle = "rgba(212, 175, 55, 0.85)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(px(mean[0] - cx * axisLen), py(mean[1] - cy * axisLen));
    ctx.lineTo(px(mean[0] + cx * axisLen), py(mean[1] + cy * axisLen));
    ctx.stroke();
    ctx.setLineDash([]);

    // projection footprints
    ctx.fillStyle = "rgba(212, 175, 55, 0.28)";
    for (const [x, y] of points) {
      const t = (x - mean[0]) * cx + (y - mean[1]) * cy;
      const projX = mean[0] + cx * t;
      const projY = mean[1] + cy * t;
      ctx.beginPath();
      ctx.arc(px(projX), py(projY), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // data points
    ctx.fillStyle = "rgba(99, 179, 237, 0.55)";
    for (const [x, y] of points) {
      ctx.beginPath();
      ctx.arc(px(x), py(y), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // principal axes (PC1, PC2)
    drawArrow(ctx, px(mean[0]), py(mean[1]), px(mean[0] + vecs[0][0] * Math.sqrt(vals[0]) * 2.4), py(mean[1] + vecs[0][1] * Math.sqrt(vals[0]) * 2.4), "rgba(255,80,120,0.95)", 2.5);
    drawArrow(ctx, px(mean[0]), py(mean[1]), px(mean[0] + vecs[1][0] * Math.sqrt(vals[1]) * 2.4), py(mean[1] + vecs[1][1] * Math.sqrt(vals[1]) * 2.4), "rgba(180,255,120,0.85)", 2);

    // labels
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "rgba(255,80,120,0.95)";
    ctx.fillText(`PC1 · λ=${vals[0].toFixed(2)}`, px(mean[0] + vecs[0][0] * Math.sqrt(vals[0]) * 2.4) + 6, py(mean[1] + vecs[0][1] * Math.sqrt(vals[0]) * 2.4));
    ctx.fillStyle = "rgba(180,255,120,0.95)";
    ctx.fillText(`PC2 · λ=${vals[1].toFixed(2)}`, px(mean[0] + vecs[1][0] * Math.sqrt(vals[1]) * 2.4) + 6, py(mean[1] + vecs[1][1] * Math.sqrt(vals[1]) * 2.4));
  }, [points, vals, vecs, theta, mean]);

  function reset() {
    setRho(0.7);
    setTheta(0.6);
    setN(200);
  }

  return (
    <VizFrame
      title="PCA projector"
      subtitle={`ρ=${rho.toFixed(2)} · θ=${(theta * 180 / Math.PI).toFixed(0)}° · variance captured ${(projFraction * 100).toFixed(1)}%`}
      onReset={reset}
      fullScreenHref="/playground/pca-projector"
    >
      <div className="grid lg:grid-cols-[1fr_240px]">
        <div className="bg-[var(--color-muted)]/40">
          <canvas
            ref={canvasRef}
            className="block w-full h-auto"
            style={{ aspectRatio: `${W} / ${H}` }}
          />
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-soft p-5 space-y-4">
          <Field label={`Correlation ρ · ${rho.toFixed(2)}`}>
            <input
              aria-label="Correlation rho"
              type="range"
              min={-0.95}
              max={0.95}
              step={0.01}
              value={rho}
              onChange={(e) => setRho(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <Field label={`Projection angle θ · ${(theta * 180 / Math.PI).toFixed(0)}°`}>
            <input
              aria-label="Projection angle theta"
              type="range"
              min={0}
              max={Math.PI}
              step={0.01}
              value={theta}
              onChange={(e) => setTheta(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
            <button
              onClick={() => setTheta(((principalTheta % Math.PI) + Math.PI) % Math.PI)}
              className="mt-2 w-full rounded-md border border-soft px-2 py-1 text-[10px] hover:bg-[var(--color-muted)]"
            >
              Snap to PC1 ({(principalTheta * 180 / Math.PI).toFixed(0)}°)
            </button>
          </Field>
          <Field label={`Sample size · ${n}`}>
            <input
              aria-label="Sample size"
              type="range"
              min={20}
              max={500}
              step={10}
              value={n}
              onChange={(e) => setN(+e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          <div className="rounded-md border border-soft px-2 py-1.5 text-[11px]">
            <div className="text-[var(--color-muted-fg)] uppercase tracking-[0.14em] text-[9px]">Variance captured</div>
            <div className="font-mono text-[var(--color-fg)] tabular-nums">
              {projVar.toFixed(3)} / {totalVar.toFixed(3)} ({(projFraction * 100).toFixed(1)}%)
            </div>
            <div className="mt-1 h-1.5 rounded bg-[var(--color-muted)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)]"
                style={{ width: `${projFraction * 100}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-muted-fg)] leading-relaxed">
            PC1 (red) is the direction of maximum variance — the eigenvector of the covariance with
            the largest eigenvalue. Snap θ to PC1 to maximize captured variance.
          </p>
        </div>
      </div>
    </VizFrame>
  );
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  // head
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const ah = 9;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ah * Math.cos(angle - Math.PI / 7), y2 - ah * Math.sin(angle - Math.PI / 7));
  ctx.lineTo(x2 - ah * Math.cos(angle + Math.PI / 7), y2 - ah * Math.sin(angle + Math.PI / 7));
  ctx.closePath();
  ctx.fill();
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
