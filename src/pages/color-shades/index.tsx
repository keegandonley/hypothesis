import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/color-shades.module.css";
import { Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { generateShades, isDark } from "@/lib/color-shades";
import { useUrlSync } from "@/lib/useUrlSync";

export default function ColorShadesPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const isIframe = useIsIframe();
  const [color, setColor] = useState("#3b82f6");
  const [pageUrl, setPageUrl] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shades = generateShades(color);

  const buildUrl = (c: string): string =>
    `${window.location.origin}${window.location.pathname}?c=${encodeURIComponent(c)}`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");

    if (c && /^#[0-9a-fA-F]{6}$/.test(c)) setColor(c); // eslint-disable-line react-hooks/set-state-in-effect
    setPageUrl(window.location.href);
  }, []);

  const handleColorInput = (val: string): void => {
    setColor(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const newUrl = buildUrl(val);

      replaceUrl(newUrl);
      setPageUrl(newUrl);
    }
  };

  const handlePickerChange = (val: string): void => {
    setColor(val);
    const newUrl = buildUrl(val);

    replaceUrl(newUrl);
    setPageUrl(newUrl);
  };

  const handleReset = (): void => {
    setColor("#3b82f6");
    const newUrl = buildUrl("#3b82f6");

    replaceUrlNow(newUrl);
    setPageUrl(newUrl);
  };

  const handleCopyShade = (hex: string, i: number): void => {
    void copyToClipboard(hex).then(() => {
      setCopiedIndex(i);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedIndex(null);
      }, 1200);
    });
  };

  const handleCopyAll = (): void => {
    if (!shades) return;
    const tailwindPalette = shades
      .map(({ step, hex }) => `  ${step}: "${hex}"`)
      .join(",\n");
    const text = `{\n${tailwindPalette}\n}`;

    void copyToClipboard(text).then(() => {
      setCopiedAll(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedAll(false);
      }, 1500);
    });
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Color Shades Generator"
        metaDescription="Generate tints and shades from any base color for design systems and palettes. Free online color shades generator — no installation required. No data sent to servers."
        path="/color-shades"
        h1="Color Shades"
        tagline="Generate a perceptually uniform 11-step color scale from any hex color"
      >

      <div className={styles.body}>
        <div className={styles.controls}>
          <div className={styles.colorInputGroup}>
            <input
              type="color"
              className={styles.colorPicker}
              value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000"}
              onChange={(e) => {
                handlePickerChange(e.target.value);
              }}
            />
            <input
              type="text"
              className={styles.hexInput}
              value={color}
              onChange={(e) => {
                handleColorInput(e.target.value);
              }}
              placeholder="#3b82f6"
              spellCheck={false}
              maxLength={7}
            />
          </div>
          {!isIframe && (
            <Button
              variant="copy"
              copied={copiedAll}
              onClick={handleCopyAll}
              disabled={!shades}
            >
              Copy as Tailwind
            </Button>
          )}
        </div>

        <div className={styles.shades}>
          {shades ? (
            shades.map(({ step, hex }, i) => (
              <button
                key={step}
                className={styles.shade}
                style={{ backgroundColor: hex }}
                onClick={() => {
                  if (!isIframe) handleCopyShade(hex, i);
                }}
                title={copiedIndex === i ? "Copied!" : hex}
              >
                <span
                  className={styles.shadeStep}
                  style={{
                    color: isDark(hex)
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(0,0,0,0.55)",
                  }}
                >
                  {step}
                </span>
                <span
                  className={styles.shadeHex}
                  style={{
                    color: isDark(hex)
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(0,0,0,0.45)",
                  }}
                >
                  {copiedIndex === i ? "✓" : hex}
                </span>
              </button>
            ))
          ) : (
            <span className={styles.invalid}>
              Enter a valid 6-digit hex color
            </span>
          )}
        </div>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={pageUrl} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
