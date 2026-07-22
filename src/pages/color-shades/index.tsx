import React, { useEffect, useState } from "react";
import styles from "@/styles/color-shades.module.css";
import { Button, PageLayout, PermalinkRow } from "@/components/ui";
import { useCopyFeedback } from "@/lib/useCopyFeedback";
import { useIsIframe } from "@/lib/useIsIframe";
import { generateShades, isDark } from "@/lib/color-shades";
import { useUrlSync } from "@/lib/useUrlSync";

export default function ColorShadesPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const isIframe = useIsIframe();
  const [color, setColor] = useState("#3b82f6");
  const [pageUrl, setPageUrl] = useState("");
  const { copiedKey, copy } = useCopyFeedback<number | "all">();

  const copiedIndex = typeof copiedKey === "number" ? copiedKey : null;
  const copiedAll = copiedKey === "all";

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
    copy(i, hex);
  };

  const handleCopyAll = (): void => {
    if (!shades) return;
    const tailwindPalette = shades
      .map(({ step, hex }) => `  ${step}: "${hex}"`)
      .join(",\n");

    copy("all", `{\n${tailwindPalette}\n}`);
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
