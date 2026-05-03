import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Embed } from "@/components/content/Embed";
import type { VizKey } from "@/lib/types";

const VALID_KEYS: VizKey[] = [
  "gradient-descent",
  "nn-playground",
  "attention-heatmap",
  "diffusion-denoise",
  "embedding-explorer-3d",
  "tokenizer",
  "backprop-stepper",
  "transformer-3d",
  "pca-projector",
  "kernel-trick",
  "moe-router",
  "rl-gridworld",
];

const TITLES: Record<VizKey, string> = {
  "gradient-descent": "Gradient descent playground",
  "nn-playground": "Neural network playground",
  "attention-heatmap": "Attention head viewer",
  "diffusion-denoise": "Diffusion denoising",
  "embedding-explorer-3d": "Embedding space",
  "tokenizer": "Tokenizer",
  "backprop-stepper": "Backpropagation, step by step",
  "transformer-3d": "Transformer walkthrough",
  "pca-projector": "PCA projector",
  "kernel-trick": "Kernel trick",
  "moe-router": "Mixture-of-Experts router",
  "rl-gridworld": "Q-learning gridworld",
};

export function generateStaticParams() {
  return VALID_KEYS.map((viz) => ({ viz }));
}

export async function generateMetadata({ params }: { params: Promise<{ viz: string }> }): Promise<Metadata> {
  const { viz } = await params;
  const title = TITLES[viz as VizKey] ?? "Playground";
  return { title };
}

export default async function PlaygroundPage({ params }: { params: Promise<{ viz: string }> }) {
  const { viz } = await params;
  if (!VALID_KEYS.includes(viz as VizKey)) notFound();
  const title = TITLES[viz as VizKey];

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <Link
            href="/map"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to map
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
        </div>
        <Embed viz={viz as VizKey} />
      </div>
    </main>
  );
}
