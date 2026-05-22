import React, { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import styles from "@/styles/app-store-screenshot.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";

type Dimension =
  | "1242x2688"
  | "2688x1242"
  | "1284x2778"
  | "2778x1284"
  | "2064x2752"
  | "2752x2064"
  | "2048x2732"
  | "2732x2048";

const DIMS: Record<
  Dimension,
  { w: number; h: number; label: string; group: string }
> = {
  "1242x2688": { w: 1242, h: 2688, label: '6.5" Portrait', group: "iPhone" },
  "2688x1242": { w: 2688, h: 1242, label: '6.5" Landscape', group: "iPhone" },
  "1284x2778": { w: 1284, h: 2778, label: '6.7" Portrait', group: "iPhone" },
  "2778x1284": { w: 2778, h: 1284, label: '6.7" Landscape', group: "iPhone" },
  "2064x2752": { w: 2064, h: 2752, label: '12.9" Portrait', group: "iPad" },
  "2752x2064": { w: 2752, h: 2064, label: '12.9" Landscape', group: "iPad" },
  "2048x2732": { w: 2048, h: 2732, label: '13" Portrait', group: "iPad" },
  "2732x2048": { w: 2732, h: 2048, label: '13" Landscape', group: "iPad" },
};

const DIM_KEYS = Object.keys(DIMS) as Dimension[];

const MAX_PREVIEW_H = 480;

function buildUrl(
  dim: Dimension,
  bg: string,
  scale: number,
  radius: number,
  shadow: number,
  grad: boolean,
  bg2: string,
  angle: number,
): string {
  const params = new URLSearchParams();

  params.set("dim", dim);
  params.set("bg", bg.replace("#", ""));
  params.set("scale", String(scale));
  params.set("radius", String(radius));
  params.set("shadow", String(shadow));
  if (grad) {
    params.set("grad", "1");
    params.set("bg2", bg2.replace("#", ""));
    params.set("angle", String(angle));
  }

  return `${window.location.origin}${window.location.pathname}?${params}`;
}

function gradientCoords(w: number, h: number, angleDeg: number): number[] {
  const rad = (angleDeg * Math.PI) / 180;
  const len = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));

  return [
    w / 2 - (len / 2) * Math.sin(rad),
    h / 2 - (len / 2) * Math.cos(rad),
    w / 2 + (len / 2) * Math.sin(rad),
    h / 2 + (len / 2) * Math.cos(rad),
  ];
}

export default function AppStoreScreenshot(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();

  const [dim, setDim] = useState<Dimension>(() => {
    if (typeof window === "undefined") return "1242x2688";
    const d = new URLSearchParams(window.location.search).get(
      "dim",
    ) as Dimension | null;

    return d && DIM_KEYS.includes(d) ? d : "1242x2688";
  });

  const [bgColor, setBgColor] = useState(() => {
    if (typeof window === "undefined") return "#1a1a2e";
    const bg = new URLSearchParams(window.location.search).get("bg");

    return bg ? `#${bg}` : "#1a1a2e";
  });

  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [scale, setScale] = useState(() => {
    if (typeof window === "undefined") return 85;
    const sc = new URLSearchParams(window.location.search).get("scale");

    return sc ? Number(sc) : 85;
  });

  const [borderRadius, setBorderRadius] = useState(() => {
    if (typeof window === "undefined") return 0;
    const r = new URLSearchParams(window.location.search).get("radius");

    return r ? Number(r) : 0;
  });

  const [shadowBlur, setShadowBlur] = useState(() => {
    if (typeof window === "undefined") return 0;
    const sh = new URLSearchParams(window.location.search).get("shadow");

    return sh ? Number(sh) : 0;
  });

  const [gradientEnabled, setGradientEnabled] = useState(() => {
    if (typeof window === "undefined") return false;

    return new URLSearchParams(window.location.search).get("grad") === "1";
  });

  const [bgColor2, setBgColor2] = useState(() => {
    if (typeof window === "undefined") return "#4a1a8e";
    const bg2 = new URLSearchParams(window.location.search).get("bg2");

    return bg2 ? `#${bg2}` : "#4a1a8e";
  });

  const [gradientAngle, setGradientAngle] = useState(() => {
    if (typeof window === "undefined") return 145;
    const ang = new URLSearchParams(window.location.search).get("angle");

    return ang ? Number(ang) : 145;
  });

  const [dragging, setDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync URL on state change
  useEffect(() => {
    const url = buildUrl(
      dim,
      bgColor,
      scale,
      borderRadius,
      shadowBlur,
      gradientEnabled,
      bgColor2,
      gradientAngle,
    );

    history.replaceState(null, "", url);
  }, [
    dim,
    bgColor,
    scale,
    borderRadius,
    shadowBlur,
    gradientEnabled,
    bgColor2,
    gradientAngle,
  ]);

  // Redraw canvas on any relevant state change
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;
    const { w, h } = DIMS[dim];

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    if (gradientEnabled) {
      const [x0, y0, x1, y1] = gradientCoords(w, h, gradientAngle);
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);

      grad.addColorStop(0, bgColor);
      grad.addColorStop(1, bgColor2);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bgColor;
    }

    ctx.fillRect(0, 0, w, h);
    if (!imageSrc) return;
    const img = new Image();

    img.onload = () => {
      const maxW = w * (scale / 100);
      const maxH = h * (scale / 100);
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const dw = img.width * ratio;
      const dh = img.height * ratio;
      const x = (w - dw) / 2;
      const y = (h - dh) / 2;

      ctx.save();

      if (shadowBlur > 0) {
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadowBlur * 0.4;
        // Draw an opaque rect to cast the shadow; the image will cover it
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.roundRect(x, y, dw, dh, borderRadius);
        ctx.fill();
        ctx.shadowColor = "transparent";
      }

      // Clip to rounded rect then draw image
      ctx.beginPath();
      ctx.roundRect(x, y, dw, dh, borderRadius);
      ctx.clip();
      ctx.drawImage(img, x, y, dw, dh);

      ctx.restore();
    };

    img.src = imageSrc;
  }, [
    dim,
    bgColor,
    imageSrc,
    scale,
    borderRadius,
    shadowBlur,
    gradientEnabled,
    bgColor2,
    gradientAngle,
  ]);

  const handleFile = (file: File): void => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();

    reader.onload = (e) => {
      const target = e.target;

      if (target && target instanceof FileReader) {
        const result = target.result;

        if (typeof result === "string") setImageSrc(result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];

    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];

    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (): void => {
    setDragging(false);
  };

  const handleDownload = (): void => {
    const canvas = canvasRef.current;

    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");

    a.href = url;
    a.download = `appstore-${dim}.png`;
    a.click();
  };

  const handleReset = (): void => {
    setImageSrc(null);
    setDim("1242x2688");
    setBgColor("#1a1a2e");
    setScale(85);
    setBorderRadius(0);
    setShadowBlur(0);
    setGradientEnabled(false);
    setBgColor2("#4a1a8e");
    setGradientAngle(145);
  };

  const { w, h } = DIMS[dim];
  const previewScale = MAX_PREVIEW_H / h;
  const previewW = Math.round(w * previewScale);
  const previewH = MAX_PREVIEW_H;

  return (
    <div className={styles.page}>
      <ToolHead
        title="App Store Screenshot Generator"
        description="Compose device screenshots at exact Apple App Store dimensions and download ready-to-submit PNGs."
        path="/app-store-screenshot"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link
            href="/"
            target={isIframe ? "_blank" : undefined}
            rel={isIframe ? "noopener noreferrer" : undefined}
            className={styles.domainLink}
          >
            {branding.domain}
          </Link>
          {"·"}
          <Link href="/docs/app-store-screenshot" className={styles.docsLink}>
            <DocIcon className={styles.icon} />
            docs
          </Link>
        </div>
        <h1 className={styles.title}>App Store Screenshot</h1>
        <p className={styles.tagline}>
          Compose screenshots at exact Apple App Store dimensions and export
          ready-to-submit PNGs
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.controlsCard}>
            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Size</span>
            </div>
            {(["iPhone", "iPad"] as const).map((group) => (
              <div key={group} className={styles.sizeGroup}>
                <span className={styles.sizeGroupLabel}>{group}</span>
                <div className={styles.toggleGrid}>
                  {DIM_KEYS.filter((d) => DIMS[d].group === group).map((d) => (
                    <button
                      key={d}
                      className={`${styles.toggleBtn}${dim === d ? ` ${styles.active}` : ""}`}
                      onClick={() => {
                        setDim(d);
                      }}
                    >
                      {DIMS[d].label}
                      <span className={styles.dimPx}>
                        {d.replace("x", "×")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className={styles.controlsSeparator} />

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>BG</span>
              <label className={styles.colorRow}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                  }}
                  className={styles.colorInput}
                />
                <span className={styles.colorHex}>{bgColor.toUpperCase()}</span>
              </label>
              <button
                className={`${styles.gradientToggle}${gradientEnabled ? ` ${styles.active}` : ""}`}
                onClick={() => {
                  setGradientEnabled((v) => !v);
                }}
              >
                Gradient
              </button>
            </div>

            {gradientEnabled && (
              <>
                <div className={styles.controlRow}>
                  <span className={styles.controlLabel}>BG2</span>
                  <label className={styles.colorRow}>
                    <input
                      type="color"
                      value={bgColor2}
                      onChange={(e) => {
                        setBgColor2(e.target.value);
                      }}
                      className={styles.colorInput}
                    />
                    <span className={styles.colorHex}>
                      {bgColor2.toUpperCase()}
                    </span>
                  </label>
                </div>
                <div className={styles.controlRow}>
                  <span className={styles.controlLabel}>Angle</span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={gradientAngle}
                    onChange={(e) => {
                      setGradientAngle(Number(e.target.value));
                    }}
                    className={styles.slider}
                  />
                  <span className={styles.sliderValue}>{gradientAngle}°</span>
                </div>
              </>
            )}

            <div className={styles.controlsSeparator} />

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Scale</span>
              <input
                type="range"
                min={40}
                max={100}
                value={scale}
                onChange={(e) => {
                  setScale(Number(e.target.value));
                }}
                className={styles.slider}
              />
              <span className={styles.sliderValue}>{scale}%</span>
            </div>

            <div className={styles.controlsSeparator} />

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Radius</span>
              <input
                type="range"
                min={0}
                max={200}
                value={borderRadius}
                onChange={(e) => {
                  setBorderRadius(Number(e.target.value));
                }}
                className={styles.slider}
              />
              <span className={styles.sliderValue}>{borderRadius}px</span>
            </div>

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Shadow</span>
              <input
                type="range"
                min={0}
                max={150}
                value={shadowBlur}
                onChange={(e) => {
                  setShadowBlur(Number(e.target.value));
                }}
                className={styles.slider}
              />
              <span className={styles.sliderValue}>{shadowBlur}px</span>
            </div>
          </div>

          <div
            className={`${styles.dropZone}${dragging ? ` ${styles.dragging}` : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && fileInputRef.current?.click()
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleFileInput}
            />
            <span className={styles.dropZoneIcon}>📱</span>
            {imageSrc ? (
              <span className={styles.dropZoneText}>
                Replace image —{" "}
                <span className={styles.browseLink}>browse</span> or drop
              </span>
            ) : (
              <span className={styles.dropZoneText}>
                Drop screenshot or{" "}
                <span className={styles.browseLink}>browse</span>
              </span>
            )}
            <span className={styles.dropZoneHint}>
              PNG, JPEG, WEBP supported
            </span>
          </div>

          {!isIframe && (
            <button className={styles.downloadBtn} onClick={handleDownload}>
              Download PNG — {dim.replace("x", "×")}
            </button>
          )}
        </div>

        <div className={styles.rightCol}>
          <div className={styles.previewPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Preview</span>
              <span className={styles.panelDim}>
                {w}×{h}px
              </span>
            </div>
            <div className={styles.previewBody}>
              <div
                className={styles.previewWrapper}
                style={{ width: previewW, height: previewH }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    transformOrigin: "top left",
                    transform: `scale(${previewScale})`,
                  }}
                />
              </div>
              {!imageSrc && (
                <p className={styles.emptyState}>
                  Upload a screenshot to preview the composition, or download a
                  template
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.footerRow}>
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
