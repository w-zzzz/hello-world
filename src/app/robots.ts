import type { MetadataRoute } from "next";

/**
 * SEO robots.txt — allow all, point at the generated sitemap.
 *
 * The base URL is taken from `NEXT_PUBLIC_SITE_URL` if set (e.g. the production
 * deployment), and falls back to `http://localhost:3000` for local dev.
 */
export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Don't index API endpoints — they return JSON, never useful in search.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
