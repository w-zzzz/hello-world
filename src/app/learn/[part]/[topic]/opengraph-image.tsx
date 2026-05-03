import { ImageResponse } from "next/og";
import { TOPIC_BY_SLUG, PART_BY_SLUG } from "../../../../../content/curriculum";

export const runtime = "nodejs";
export const alt = "MLMap topic preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hex equivalents of the --color-part-* OKLCH variables, since ImageResponse
// (Satori) doesn't reliably parse `oklch(...)`.
const PART_HEX: Record<string, string> = {
  "01-math": "#d1495b",
  "02-classical-ml": "#e87a3e",
  "03-deep-learning": "#bcb52b",
  "04-transformers-llms": "#27a884",
  "05-reasoning-agents": "#3aa6c2",
  "06-multimodal": "#4f7ed1",
  "07-generative-theory": "#8a4cd6",
  "08-rl": "#c14ab8",
  "09-training-infra": "#7d8a9e",
  "10-cutting-edge": "#d23e75",
  "11-niche-pivotal": "#5e8b8a",
};

function partHex(slug: string): string {
  return PART_HEX[slug] ?? "#7c5cff";
}

export default async function TopicOG({
  params,
}: {
  params: { part: string; topic: string };
}) {
  const slug = `${params.part}/${params.topic}`;
  const meta = TOPIC_BY_SLUG[slug];
  const part = meta ? PART_BY_SLUG[meta.partSlug] : null;
  const accent = partHex(meta?.partSlug ?? "");

  const title = meta?.title ?? "MLMap";
  const hook = meta?.hook ?? "A PhD-grade learning map for modern AI.";
  const partLabel = part?.title ?? "MLMap";
  const tag = meta
    ? `${String(meta.partIndex).padStart(2, "0")}.${String(meta.topicIndex).padStart(2, "0")}`
    : "•";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          background: `linear-gradient(135deg, #0b0d12 0%, #11131b 60%, ${accent}33 100%)`,
          color: "#f5f6fa",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* Top row: brand + tag chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${accent}, #7c5cff)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              M
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.4 }}>
              MLMap
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              padding: "10px 18px",
              borderRadius: 999,
              background: `${accent}30`,
              border: `2px solid ${accent}`,
              color: "#f5f6fa",
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            <span style={{ fontFamily: "monospace" }}>{tag}</span>
            <span style={{ opacity: 0.8 }}>·</span>
            <span style={{ textTransform: "uppercase", letterSpacing: 3, fontSize: 16 }}>
              {partLabel}
            </span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#c8ccd9",
              maxWidth: 1000,
              lineHeight: 1.35,
            }}
          >
            {hook}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 20,
              color: "#a0a4b8",
            }}
          >
            <span>{meta ? `${meta.estMinutes} min · difficulty ${meta.difficulty}/5` : "Open the map"}</span>
          </div>
          <div
            style={{
              height: 8,
              flex: 1,
              marginLeft: 32,
              borderRadius: 4,
              background: `linear-gradient(to right, ${accent}, ${accent}40 70%, transparent)`,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
