import type { MetadataRoute } from "next";

/**
 * PWA manifest. Icons are produced at build time by `app/icon.tsx` and
 * `app/apple-icon.tsx` (Next's `ImageResponse` flow), so the URLs below are
 * the route handlers Next exposes at build time — no binary blobs in the repo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MLMap — A PhD-grade learning map for modern AI",
    short_name: "MLMap",
    description:
      "Interactive ML/DL/AI curriculum: 68 topics across 11 parts, 12 hand-built visualizations, a 138-event timeline, 7 learning paths, 20 paper stories, and 101 researcher profiles.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#0b0b10",
    background_color: "#0b0b10",
    categories: ["education", "productivity", "books"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
