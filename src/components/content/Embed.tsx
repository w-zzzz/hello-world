"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { VizKey } from "@/lib/types";

function Fallback() {
  return (
    <div className="grid place-items-center h-[420px] rounded-2xl border border-soft surface text-[var(--color-muted-fg)]">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading visualization…
      </div>
    </div>
  );
}

/** Each hero viz lazy-loads on first paint. */
const registry: Record<VizKey, React.ComponentType> = {
  "gradient-descent": dynamic(() => import("@/components/viz/GradientDescent").then((m) => m.GradientDescent), { ssr: false, loading: Fallback }),
  "nn-playground": dynamic(() => import("@/components/viz/NNPlayground").then((m) => m.NNPlayground), { ssr: false, loading: Fallback }),
  "attention-heatmap": dynamic(() => import("@/components/viz/AttentionHeatmap").then((m) => m.AttentionHeatmap), { ssr: false, loading: Fallback }),
  "diffusion-denoise": dynamic(() => import("@/components/viz/DiffusionDenoise").then((m) => m.DiffusionDenoise), { ssr: false, loading: Fallback }),
  "embedding-explorer-3d": dynamic(() => import("@/components/viz/EmbeddingExplorer3D").then((m) => m.EmbeddingExplorer3D), { ssr: false, loading: Fallback }),
  "tokenizer": dynamic(() => import("@/components/viz/TokenizerViz").then((m) => m.TokenizerViz), { ssr: false, loading: Fallback }),
  "backprop-stepper": dynamic(() => import("@/components/viz/BackpropStepper").then((m) => m.BackpropStepper), { ssr: false, loading: Fallback }),
  "transformer-3d": dynamic(() => import("@/components/viz/TransformerWalkthrough3D").then((m) => m.TransformerWalkthrough3D), { ssr: false, loading: Fallback }),
  "pca-projector": dynamic(() => import("@/components/viz/PCAProjector").then((m) => m.PCAProjector), { ssr: false, loading: Fallback }),
  "kernel-trick": dynamic(() => import("@/components/viz/KernelTrickViz").then((m) => m.KernelTrickViz), { ssr: false, loading: Fallback }),
  "moe-router": dynamic(() => import("@/components/viz/MoERouterViz").then((m) => m.MoERouterViz), { ssr: false, loading: Fallback }),
  "rl-gridworld": dynamic(() => import("@/components/viz/RLGridworld").then((m) => m.RLGridworld), { ssr: false, loading: Fallback }),
};

export function Embed({ viz }: { viz: VizKey }) {
  const Comp = registry[viz];
  if (!Comp) {
    return (
      <div className="mt-8 rounded-2xl border border-soft surface p-10 text-center text-sm text-[var(--color-muted-fg)]">
        <div className="text-[var(--color-fg)] font-medium mb-2">Visualization coming soon</div>
        <code className="text-xs">{viz}</code>
      </div>
    );
  }
  return (
    <div className="mt-8">
      <Comp />
    </div>
  );
}
