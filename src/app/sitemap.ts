import type { MetadataRoute } from "next";
import { TOPICS } from "../../content/curriculum";
import { RESEARCHERS } from "../../content/researchers";
import { STORIES } from "../../content/stories";
import { PATHS } from "../../content/paths";
import type { VizKey } from "@/lib/types";

const VIZ_KEYS: VizKey[] = [
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

/**
 * Build a single sitemap covering every public route. Driven entirely by
 * `content/*.ts` so adding a topic, researcher, story, or path automatically
 * extends the sitemap on the next build.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const lastModified = new Date();

  // Top-level navigation routes.
  const top: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/map`, lastModified, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/timeline`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/paths`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/stories`, lastModified, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/researchers`, lastModified, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/resources`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/dashboard`, lastModified, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/about`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];

  const topics: MetadataRoute.Sitemap = TOPICS.map((t) => ({
    url: `${base}/learn/${t.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: t.flagship ? 0.9 : 0.8,
  }));

  const researchers: MetadataRoute.Sitemap = RESEARCHERS.map((r) => ({
    url: `${base}/researchers/${r.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const stories: MetadataRoute.Sitemap = STORIES.map((s) => ({
    url: `${base}/stories/${s.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const paths: MetadataRoute.Sitemap = PATHS.map((p) => ({
    url: `${base}/paths/${p.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  const playgrounds: MetadataRoute.Sitemap = VIZ_KEYS.map((v) => ({
    url: `${base}/playground/${v}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...top, ...topics, ...researchers, ...stories, ...paths, ...playgrounds];
}
