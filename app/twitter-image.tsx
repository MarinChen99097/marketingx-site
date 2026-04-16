import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SaleCraft — AI Marketing Consultant";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  const interBold = await fetch(
    new URL(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf"
    )
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-200px",
            width: "800px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(221,106,64,0.15) 0%, rgba(221,106,64,0.05) 40%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "500px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(221,106,64,0.08) 0%, transparent 60%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "28px",
              background: "linear-gradient(135deg, #DD6A40, #c25a35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 60px rgba(221,106,64,0.3)",
            }}
          >
            <svg width="64" height="64" viewBox="0 0 32 32">
              <path d="M2 2 H7 V23 H14 V28 H2 Z" fill="white" />
              <path d="M12 28 L20.5 2 L29 28 H24 L20.5 9 L17 28 Z" fill="white" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "72px",
                fontWeight: 800,
                color: "white",
                letterSpacing: "-2px",
                lineHeight: 1,
              }}
            >
              SaleCraft
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 500,
                color: "#DD6A40",
                marginTop: "12px",
                letterSpacing: "-0.5px",
              }}
            >
              AI Marketing Consultant
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: "40px",
            fontSize: "22px",
            color: "rgba(255,255,255,0.5)",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Free consultation. Expert strategy. AI execution.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          salecraft.ai
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interBold,
          style: "normal",
          weight: 800,
        },
      ],
    }
  );
}
