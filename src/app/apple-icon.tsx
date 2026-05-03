import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon. Same brand gradient as `icon.tsx`, sized for iOS home-screen.
 * The black backdrop keeps the mark crisp when iOS draws its rounded mask over it.
 */
export default function AppleIcon() {
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
            width: 152,
            height: 152,
            borderRadius: 36,
            background: "linear-gradient(135deg, #7c5cff 0%, #f5a623 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: -2,
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
            boxShadow: "inset 0 -8px 24px rgba(0,0,0,0.25)",
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size }
  );
}
