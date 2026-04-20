import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/color-shades.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

function hexToOklch(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);

  const x = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const y = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const z = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bv * bv);
  const H = (Math.atan2(bv, a) * 180) / Math.PI;

  return [L, C, (H + 360) % 360];
}

function oklchToHex(L: number, C: number, H: number): string {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bOut = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSrgb = (c: number) => {
    const clipped = Math.max(0, Math.min(1, c));
    return clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * Math.pow(clipped, 1 / 2.4) - 0.055;
  };

  const toHex = (c: number) => Math.round(toSrgb(c) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bOut)}`;
}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LIGHTNESS = [0.97, 0.94, 0.88, 0.80, 0.70, 0.57, 0.46, 0.37, 0.28, 0.20, 0.14];

function generateShades(hex: string): Array<{ step: number; hex: string }> | null {
  const lch = hexToOklch(hex);
  if (!lch) return null;
  const [, C, H] = lch;
  return STEPS.map((step, i) => ({
    step,
    hex: oklchToHex(LIGHTNESS[i], C * 0.85, H),
  }));
}

function isDark(hex: string): boolean {
  const lch = hexToOklch(hex);
  return lch ? lch[0] < 0.5 : false;
}

export default function ColorShadesPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [color, setColor] = useState("#3b82f6");
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shades = generateShades(color);

  const buildUrl = (c: string) =>
    `${window.location.origin}${window.location.pathname}?c=${encodeURIComponent(c)}`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c");
    if (c && /^#[0-9a-fA-F]{6}$/.test(c)) setColor(c);
    setPageUrl(window.location.href);
  }, []);

  const handleColorInput = (val: string) => {
    setColor(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      const newUrl = buildUrl(val);
      history.replaceState(null, "", newUrl);
      setPageUrl(newUrl);
    }
  };

  const handlePickerChange = (val: string) => {
    setColor(val);
    const newUrl = buildUrl(val);
    history.replaceState(null, "", newUrl);
    setPageUrl(newUrl);
  };

  const handleCopy = () => {
    copyToClipboard(pageUrl).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleReset = () => {
    setColor("#3b82f6");
    const newUrl = buildUrl("#3b82f6");
    history.replaceState(null, "", newUrl);
    setPageUrl(newUrl);
  };

  const handleCopyShade = (hex: string, i: number) => {
    copyToClipboard(hex).then(() => {
      setCopiedIndex(i);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 1200);
    });
  };

  const handleCopyAll = () => {
    if (!shades) return;
    const tailwindPalette = shades.map(({ step, hex }) => `  ${step}: "${hex}"`).join(",\n");
    const text = `{\n${tailwindPalette}\n}`;
    copyToClipboard(text).then(() => {
      setCopiedAll(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedAll(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="Color Shades Generator"
        description="Generate tints and shades from any base color for design systems and palettes. Free online color shades generator — no installation required. No data sent to servers."
        path="/color-shades"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link href="/docs/color-shades" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Color Shades</h1>
        <p className={styles.tagline}>Generate a perceptually uniform 11-step color scale from any hex color</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.body}>
        <div className={styles.controls}>
          <div className={styles.colorInputGroup}>
            <input
              type="color"
              className={styles.colorPicker}
              value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000"}
              onChange={(e) => handlePickerChange(e.target.value)}
            />
            <input
              type="text"
              className={styles.hexInput}
              value={color}
              onChange={(e) => handleColorInput(e.target.value)}
              placeholder="#3b82f6"
              spellCheck={false}
              maxLength={7}
            />
          </div>
          {!isIframe && (
            <button
              className={`${styles.panelCopyBtn}${copiedAll ? ` ${styles.panelCopied}` : ""}`}
              onClick={handleCopyAll}
              disabled={!shades}
            >
              {copiedAll ? "Copied!" : "Copy as Tailwind"}
            </button>
          )}
        </div>

        <div className={styles.shades}>
          {shades ? (
            shades.map(({ step, hex }, i) => (
              <button
                key={step}
                className={styles.shade}
                style={{ backgroundColor: hex }}
                onClick={() => !isIframe && handleCopyShade(hex, i)}
                title={copiedIndex === i ? "Copied!" : hex}
              >
                <span className={styles.shadeStep} style={{ color: isDark(hex) ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)" }}>
                  {step}
                </span>
                <span className={styles.shadeHex} style={{ color: isDark(hex) ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)" }}>
                  {copiedIndex === i ? "✓" : hex}
                </span>
              </button>
            ))
          ) : (
            <span className={styles.invalid}>Enter a valid 6-digit hex color</span>
          )}
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{pageUrl}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
