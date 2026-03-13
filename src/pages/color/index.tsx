import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/color.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RGBA {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
  a: number; // 0–1
}

type ColorFormat = "hex6" | "hex8" | "rgb" | "rgba" | "hsl" | "oklch";

// ─── Color Math ───────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function parseHex(s: string): RGBA | null {
  const m = s.trim().match(/^#?([0-9a-f]{6}([0-9a-f]{2})?)$/i);
  if (!m) return null;
  const hex = m[1];
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function parseRGB(s: string): RGBA | null {
  const m = s
    .trim()
    .match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
    );
  if (!m) return null;
  const r = clamp(Math.round(parseFloat(m[1])), 0, 255);
  const g = clamp(Math.round(parseFloat(m[2])), 0, 255);
  const b = clamp(Math.round(parseFloat(m[3])), 0, 255);
  const a = m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : 1;
  return { r, g, b, a };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
}

function parseHSL(s: string): RGBA | null {
  const m = s
    .trim()
    .match(
      /^hsla?\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i,
    );
  if (!m) return null;
  const h = parseFloat(m[1]) % 360;
  const sl = clamp(parseFloat(m[2]), 0, 100);
  const l = clamp(parseFloat(m[3]), 0, 100);
  const a = m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : 1;
  const [r, g, b] = hslToRgb(h, sl, l);
  return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a };
}

// OKLCH pipeline
function linearize(c: number): number {
  const cn = c / 255;
  return cn <= 0.04045 ? cn / 12.92 : Math.pow((cn + 0.055) / 1.055, 2.4);
}

function delinearize(c: number): number {
  const clamped = clamp(c, 0, 1);
  return Math.round(
    (clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255,
  );
}

// Linear sRGB → XYZ-D65 (CSS Color 4)
function linearRgbToXyz(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const x = 0.4123908 * r + 0.3575843 * g + 0.1804808 * b;
  const y = 0.212639 * r + 0.7151687 * g + 0.0721923 * b;
  const z = 0.0193308 * r + 0.1191948 * g + 0.9505321 * b;
  return [x, y, z];
}

// XYZ-D65 → linear sRGB
function xyzToLinearRgb(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  const r = 3.2409699 * x - 1.5373832 * y - 0.4986108 * z;
  const g = -0.9692436 * x + 1.8759675 * y + 0.0415551 * z;
  const b = 0.0556301 * x - 0.203977 * y + 1.0569715 * z;
  return [r, g, b];
}

// XYZ-D65 → OKLab (Björn Ottosson)
const M1 = [
  [0.8189330101, 0.3618667424, -0.1288597137],
  [0.0329845436, 0.9293118715, 0.0361456387],
  [0.0482003018, 0.2643662691, 0.633851707],
];
const M2 = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];

function xyzToOklab(x: number, y: number, z: number): [number, number, number] {
  const lms = M1.map((row) => row[0] * x + row[1] * y + row[2] * z).map((v) =>
    Math.cbrt(v),
  );
  const L = M2[0][0] * lms[0] + M2[0][1] * lms[1] + M2[0][2] * lms[2];
  const a = M2[1][0] * lms[0] + M2[1][1] * lms[1] + M2[1][2] * lms[2];
  const b = M2[2][0] * lms[0] + M2[2][1] * lms[1] + M2[2][2] * lms[2];
  return [L, a, b];
}

const M1_INV = [
  [1.2270138511, -0.5577999807, 0.281256149],
  [-0.0405801784, 1.1122568696, -0.0716766787],
  [-0.0763812845, -0.4214819784, 1.5861632204],
];
const M2_INV = [
  [1.0, 0.3963377774, 0.2158037573],
  [1.0, -0.1055613458, -0.0638541728],
  [1.0, -0.0894841775, -1.291485548],
];

function oklabToXyz(L: number, a: number, b: number): [number, number, number] {
  const lms_ = M2_INV.map((row) => row[0] * L + row[1] * a + row[2] * b);
  const lms = lms_.map((v) => v * v * v);
  const x =
    M1_INV[0][0] * lms[0] + M1_INV[0][1] * lms[1] + M1_INV[0][2] * lms[2];
  const y =
    M1_INV[1][0] * lms[0] + M1_INV[1][1] * lms[1] + M1_INV[1][2] * lms[2];
  const z =
    M1_INV[2][0] * lms[0] + M1_INV[2][1] * lms[1] + M1_INV[2][2] * lms[2];
  return [x, y, z];
}

function rgbaToOklch(rgba: RGBA): [number, number, number] {
  const rl = linearize(rgba.r);
  const gl = linearize(rgba.g);
  const bl = linearize(rgba.b);
  const [x, y, z] = linearRgbToXyz(rl, gl, bl);
  const [L, a, b] = xyzToOklab(x, y, z);
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function parseOKLCH(s: string): RGBA | null {
  const m = s
    .trim()
    .match(
      /^oklch\(\s*([\d.]+)(?:%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i,
    );
  if (!m) return null;
  let L = parseFloat(m[1]);
  // Handle percentage L
  if (m[1].includes("%") || (L > 1 && L <= 100 && s.includes("%"))) {
    L = L / 100;
  }
  const C = parseFloat(m[2]);
  const H = parseFloat(m[3]);
  const a_alpha = m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : 1;

  const aOk = C * Math.cos((H * Math.PI) / 180);
  const bOk = C * Math.sin((H * Math.PI) / 180);
  const [x, y, z] = oklabToXyz(L, aOk, bOk);
  const [rl, gl, bl] = xyzToLinearRgb(x, y, z);
  return {
    r: clamp(delinearize(rl), 0, 255),
    g: clamp(delinearize(gl), 0, 255),
    b: clamp(delinearize(bl), 0, 255),
    a: a_alpha,
  };
}

function parseColor(s: string): RGBA | null {
  if (!s.trim()) return null;
  return parseHex(s) ?? parseRGB(s) ?? parseHSL(s) ?? parseOKLCH(s) ?? null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function toHex6(c: RGBA): string {
  const r = c.r.toString(16).padStart(2, "0");
  const g = c.g.toString(16).padStart(2, "0");
  const b = c.b.toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function toHex8(c: RGBA): string {
  const alpha = Math.round(c.a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${toHex6(c)}${alpha}`;
}

function toRGB(c: RGBA): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

function toRGBA(c: RGBA): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function toHSL(c: RGBA): string {
  const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
  if (c.a < 1) return `hsla(${h}, ${s}%, ${l}%, ${c.a})`;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function toOKLCH(c: RGBA): string {
  const [L, C, H] = rgbaToOklch(c);
  const suffix = c.a < 1 ? ` / ${c.a}` : "";
  return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(2)}${suffix})`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const FORMAT_LABELS: { id: ColorFormat; label: string }[] = [
  { id: "hex6", label: "HEX 6" },
  { id: "hex8", label: "HEX 8" },
  { id: "rgb", label: "RGB" },
  { id: "rgba", label: "RGBA" },
  { id: "hsl", label: "HSL" },
  { id: "oklch", label: "OKLCH" },
];

function formatColor(color: RGBA, fmt: ColorFormat): string {
  switch (fmt) {
    case "hex6":
      return toHex6(color);
    case "hex8":
      return toHex8(color);
    case "rgb":
      return toRGB(color);
    case "rgba":
      return toRGBA(color);
    case "hsl":
      return toHSL(color);
    case "oklch":
      return toOKLCH(color);
  }
}

export default function ColorPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [color, setColor] = useState<RGBA | null>(null);
  const [copiedId, setCopiedId] = useState<ColorFormat | null>(null);
  const [permalinkCopied, setPermalinkCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permalinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const buildUrl = (val: string) => {
    if (!val) return `${window.location.origin}${window.location.pathname}`;
    return `${window.location.origin}${window.location.pathname}?color=${encodeURIComponent(val)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("color");
    if (v) {
      setInput(v);
      setColor(parseColor(v));
    }
    setUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!colorPickerRef.current) return;
    colorPickerRef.current.value = color ? toHex6(color) : "#000000";
  }, [color]);

  const handleInputChange = (value: string) => {
    setInput(value);
    const parsed = parseColor(value);
    setColor(parsed);
    const newUrl = buildUrl(value.trim());
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = () => {
    setInput("");
    setColor(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopyFormat = (id: ColorFormat) => {
    if (!color) return;
    const value = formatColor(color, id);
    copyToClipboard(value).then(() => {
      setCopiedId(id);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleCopyPermalink = () => {
    copyToClipboard(url).then(() => {
      setPermalinkCopied(true);
      if (permalinkTimeoutRef.current)
        clearTimeout(permalinkTimeoutRef.current);
      permalinkTimeoutRef.current = setTimeout(
        () => setPermalinkCopied(false),
        1500,
      );
    });
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
      <Head>
        <title>{branding.name.toUpperCase()} — COLOR CONVERTER</title>
        <meta
          name="description"
          content="Convert color values between HEX, RGB, RGBA, HSL, and OKLCH with live preview."
        />
        <meta property="og:title" content="Color Converter" />
        <meta
          property="og:description"
          content="Convert color values between HEX, RGB, RGBA, HSL, and OKLCH with live preview."
        />
        <meta property="og:url" content="https://hypothesis.sh/color" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Color Converter" />
        <meta
          name="twitter:description"
          content="Convert color values between HEX, RGB, RGBA, HSL, and OKLCH with live preview."
        />
        <link rel="canonical" href="https://hypothesis.sh/color" />
      </Head>

      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Link
            href="/"
            target={isIframe ? "_blank" : undefined}
            rel={isIframe ? "noopener noreferrer" : undefined}
            className={styles.domainLink}
          >
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/color"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Color Converter</h1>
        <p className={styles.tagline}>
          Convert between HEX, RGB, RGBA, HSL, and OKLCH with live preview
        </p>
      </div>

      <hr className={styles.divider} />

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
          className={`${styles.input}${hasError ? ` ${styles.inputError}` : ""}`}
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="#7ee8a2, rgb(126, 232, 162), oklch(0.84 0.12 152), etc."
          spellCheck={false}
        />
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className={styles.outputGrid}>
        {FORMAT_LABELS.map(({ id, label }) => {
          const value = color ? formatColor(color, id) : "";
          const isCopied = copiedId === id;
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
                  <button
                    className={`${styles.copyBtn}${isCopied ? ` ${styles.copied}` : ""}`}
                    onClick={() => handleCopyFormat(id)}
                    disabled={!color}
                  >
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow}>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${permalinkCopied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopyPermalink}
          >
            {permalinkCopied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
