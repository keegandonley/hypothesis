import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getBranding } from "@/lib/branding";

export const config = {
  runtime: "edge",
};

export default function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain") ?? "hypothesis.sh";
  const branding = getBranding(domain);

  const bg = "#0c0c10";
  const border = "#1e1e2e";
  const text = "#f0ede8";
  const muted = "#5a5a6e";
  const accent = branding.colors.accent;
  const accentSubtle = `${accent}18`;
  const accentBorder = `${accent}33`;

  // Dot pattern SVG as data URI
  const dotSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='1' cy='1' r='1' fill='${encodeURIComponent(border)}'/></svg>`;
  const dotPattern = `url("data:image/svg+xml,${dotSvg}")`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: bg,
          backgroundImage: dotPattern,
          backgroundSize: "28px 28px",
          fontFamily: "monospace",
          color: text,
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        {/* Card container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#13131a",
            border: `1px solid ${border}`,
            borderRadius: "16px",
            padding: "64px 72px",
            width: "880px",
            gap: "0px",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              fontSize: "14px",
              letterSpacing: "0.2em",
              color: accent,
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            {branding.tagline}
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "72px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: text,
                lineHeight: 1,
              }}
            >
              {branding.name}
            </span>
            {/* Cursor */}
            <span
              style={{
                display: "flex",
                width: "6px",
                height: "60px",
                backgroundColor: accent,
                borderRadius: "2px",
                marginTop: "6px",
              }}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              borderTop: `1px solid ${border}`,
              marginBottom: "32px",
            }}
          />

          {/* Domain badge row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: accent,
                backgroundColor: accentSubtle,
                border: `1px solid ${accentBorder}`,
                borderRadius: "6px",
                padding: "6px 14px",
              }}
            >
              {branding.domain}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "13px",
                color: muted,
                letterSpacing: "0.05em",
              }}
            >
              a project by keegan.codes
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
