import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #DD6A40, #c25a35)",
          borderRadius: "40px",
        }}
      >
        <svg width="100" height="100" viewBox="0 0 32 32">
          <path d="M2 2 H7 V23 H14 V28 H2 Z" fill="white" />
          <path
            d="M12 28 L20.5 2 L29 28 H24 L20.5 9 L17 28 Z"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
