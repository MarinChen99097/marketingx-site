import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          backgroundColor: "#DD6A40",
          borderRadius: "6px",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32">
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
