import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * Brand mark for the PWA / favicon family. Rendered server-side via `ImageResponse`
 * so we don't need to ship hand-tuned PNGs. Same purple → amber gradient as the
 * OG image in `opengraph-image.tsx` to keep the brand cohesive.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b10",
        }}
      >
        <div
          style={{
            width: 432,
            height: 432,
            borderRadius: 96,
            background: "linear-gradient(135deg, #7c5cff 0%, #f5a623 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 256,
            fontWeight: 800,
            letterSpacing: -8,
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
            // Subtle inner highlight to give the mark a tactile feel.
            boxShadow: "inset 0 -16px 48px rgba(0,0,0,0.25)",
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size }
  );
}
