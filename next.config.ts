import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  // Write the report to disk so headless/CI environments don't need a browser.
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Modern image formats first; Next.js falls back to the original on older UAs.
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    remotePatterns: [
      { protocol: "https", hostname: "**.huggingface.co" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
