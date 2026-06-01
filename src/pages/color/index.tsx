import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/color.module.css";
import { useIsIframe } from "@/lib/useIsIframe";
import { Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import {
  type ColorFormat,
  type RGBA,
  formatColor,
  parseColor,
  parseHex,
  toHex6,
  toRGB,
} from "@/lib/color";

// ─── Component ────────────────────────────────────────────────────────────────

const FORMAT_LABELS: { id: ColorFormat; label: string }[] = [
  { id: "hex6", label: "HEX 6" },
  { id: "hex8", label: "HEX 8" },
  { id: "rgb", label: "RGB" },
  { id: "rgba", label: "RGBA" },
  { id: "hsl", label: "HSL" },
  { id: "oklch", label: "OKLCH" },
];

export default function ColorPage(): React.ReactNode {
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [color, setColor] = useState<RGBA | null>(null);
  const [url, setUrl] = useState("");
  const [supportsEyeDropper, setSupportsEyeDropper] = useState(false);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("color");

    if (v) {
      setInput(v);
      setColor(parseColor(v));
    }

    setUrl(window.location.href);
    setSupportsEyeDropper("EyeDropper" in window);
  }, []);

  useEffect(() => {
    if (!colorPickerRef.current) return;
    colorPickerRef.current.value = color ? toHex6(color) : "#000000";
  }, [color]);

  const buildUrl = (val: string): string => {
    if (!val) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?color=${encodeURIComponent(val)}`;
  };

  const handleInputChange = (value: string): void => {
    setInput(value);
    const parsed = parseColor(value);

    setColor(parsed);
    const newUrl = buildUrl(value.trim());

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleEyeDropper = async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await new (window as any).EyeDropper().open();

      handleInputChange(result.sRGBHex); // eslint-disable-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    } catch {
      // user cancelled
    }
  };

  const handleReset = (): void => {
    setInput("");
    setColor(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const hasError = input.trim().length > 0 && !color;
  const swatchColor = color
    ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
    : null;

  // Detect format of input for the badge
  const detectedFormat = color
    ? input.trim().startsWith("#")
      ? input.trim().length >= 9
        ? "HEX 8"
        : "HEX 6"
      : input.trim().toLowerCase().startsWith("oklch")
        ? "OKLCH"
        : input.trim().toLowerCase().startsWith("hsla") ||
            input.trim().toLowerCase().startsWith("hsl")
          ? "HSL"
          : input.trim().toLowerCase().startsWith("rgba")
            ? "RGBA"
            : "RGB"
    : null;

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Color Converter"
        metaDescription="Convert color values between HEX, RGB, RGBA, HSL, and OKLCH with live preview. Free online color converter — no installation required. No data sent to servers."
        path="/color"
        h1="Color Converter"
        tagline="Convert between HEX, RGB, RGBA, HSL, and OKLCH with live preview"
      >

      <div className={styles.previewRow}>
        <div
          className={styles.checkerboard}
          onClick={() => colorPickerRef.current?.click()}
          title="Pick a color"
        >
          <div
            className={styles.swatch}
            style={{ backgroundColor: swatchColor ?? "transparent" }}
          />
          {detectedFormat && (
            <span className={styles.formatBadge}>{detectedFormat}</span>
          )}
          <input
            ref={colorPickerRef}
            className={styles.colorPicker}
            type="color"
            onChange={(e) => {
              const parsed = parseHex(e.target.value);

              if (parsed) handleInputChange(toRGB(parsed));
            }}
          />
        </div>
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.mobileColorSwatch}
          type="color"
          value={color ? toHex6(color) : "#000000"}
          onChange={(e) => {
            const parsed = parseHex(e.target.value);

            if (parsed) handleInputChange(toRGB(parsed));
          }}
        />
        <input
          className={`${styles.input}${hasError ? ` ${styles.inputError}` : ""}`}
          type="text"
          value={input}
          onChange={(e) => {
            handleInputChange(e.target.value);
          }}
          placeholder="#7ee8a2, rgb(126, 232, 162), oklch(0.84 0.12 152), etc."
          spellCheck={false}
        />
        {supportsEyeDropper && !isIframe && (
          <Button
            variant="ghost"
            onClick={handleEyeDropper}
            title="Pick a color from anywhere on screen"
          >
            Eyedropper
          </Button>
        )}
        <Button variant="reset" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className={styles.outputGrid}>
        {FORMAT_LABELS.map(({ id, label }) => {
          const value = color ? formatColor(color, id) : "";

          return (
            <div key={id} className={styles.outputCard}>
              <div className={styles.cardSwatch}>
                <div
                  className={styles.cardSwatchColor}
                  style={{ backgroundColor: swatchColor ?? "transparent" }}
                />
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                  <span className={styles.cardLabel}>{label}</span>
                </div>
                <div className={styles.cardBottom}>
                  <span className={styles.cardValue}>{value}</span>
                  <CopyButton value={value} size="sm" disabled={!color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
