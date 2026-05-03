import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MLMap — A PhD-grade learning map for modern AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #0b0d12 0%, #11131b 50%, #1a1430 100%)",
          color: "#f5f6fa",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #7c5cff, #f5a623)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>MLMap</div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 28,
              textTransform: "uppercase",
              letterSpacing: 6,
              color: "#a0a4b8",
              fontWeight: 500,
            }}
          >
            Forty-eight topics. Eleven parts.
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            A PhD-grade learning map for modern AI.
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#c8ccd9",
              maxWidth: 980,
              lineHeight: 1.35,
            }}
          >
            From linear algebra to reasoning models, mixture-of-experts,
            state-space models, and JEPA.
          </div>
        </div>

        {/* Footer band of part hues */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[
            "#7c5cff",
            "#3da5d9",
            "#15b894",
            "#f59e0b",
            "#ef4444",
            "#ec4899",
            "#a855f7",
            "#0ea5e9",
            "#22c55e",
            "#eab308",
            "#fb923c",
          ].map((c) => (
            <div
              key={c}
              style={{ width: 92, height: 6, background: c, borderRadius: 3 }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
