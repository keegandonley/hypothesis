import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/css-unit.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

type CSSUnit = "px" | "rem" | "em" | "%" | "vh" | "vw" | "pt" | "cm" | "mm" | "in";

interface ConversionContext {
  baseFontSize: number; // px
  viewportWidth: number; // px
  viewportHeight: number; // px
}

const DEFAULT_CONTEXT: ConversionContext = {
  baseFontSize: 16,
  viewportWidth: 1920,
  viewportHeight: 1080,
};

function convertToPx(value: number, unit: CSSUnit, context: ConversionContext): number {
  switch (unit) {
    case "px":
      return value;
    case "rem":
      return value * context.baseFontSize;
    case "em":
      return value * context.baseFontSize;
    case "%":
      return (value / 100) * context.baseFontSize;
    case "vh":
      return (value / 100) * context.viewportHeight;
    case "vw":
      return (value / 100) * context.viewportWidth;
    case "pt":
      return value * (96 / 72); // 1pt = 1/72 inch, 96 DPI
    case "cm":
      return value * (96 / 2.54); // 1 inch = 2.54 cm
    case "mm":
      return value * (96 / 25.4); // 1 inch = 25.4 mm
    case "in":
      return value * 96; // 96 DPI
    default:
      return value;
  }
}

function convertFromPx(pxValue: number, unit: CSSUnit, context: ConversionContext): number {
  switch (unit) {
    case "px":
      return pxValue;
    case "rem":
      return pxValue / context.baseFontSize;
    case "em":
      return pxValue / context.baseFontSize;
    case "%":
      return (pxValue / context.baseFontSize) * 100;
    case "vh":
      return (pxValue / context.viewportHeight) * 100;
    case "vw":
      return (pxValue / context.viewportWidth) * 100;
    case "pt":
      return pxValue * (72 / 96);
    case "cm":
      return pxValue * (2.54 / 96);
    case "mm":
      return pxValue * (25.4 / 96);
    case "in":
      return pxValue / 96;
    default:
      return pxValue;
  }
}

function formatNumber(num: number): string {
  // Format to max 4 decimal places, remove trailing zeros
  return parseFloat(num.toFixed(4)).toString();
}

export default function CssUnitPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [inputValue, setInputValue] = useState<string>("16");
  const [inputUnit, setInputUnit] = useState<CSSUnit>("px");
  const [context, setContext] = useState<ConversionContext>(DEFAULT_CONTEXT);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const units: CSSUnit[] = ["px", "rem", "em", "%", "vh", "vw", "pt", "cm", "mm", "in"];

  const buildUrl = (value: string, unit: CSSUnit, ctx: ConversionContext) => {
    const params = new URLSearchParams({
      value,
      unit,
      base: ctx.baseFontSize.toString(),
      vw: ctx.viewportWidth.toString(),
      vh: ctx.viewportHeight.toString(),
    });
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    const unit = params.get("unit") as CSSUnit;
    const base = params.get("base");
    const vw = params.get("vw");
    const vh = params.get("vh");

    const newContext = { ...DEFAULT_CONTEXT };
    if (base) newContext.baseFontSize = parseFloat(base) || DEFAULT_CONTEXT.baseFontSize;
    if (vw) newContext.viewportWidth = parseFloat(vw) || DEFAULT_CONTEXT.viewportWidth;
    if (vh) newContext.viewportHeight = parseFloat(vh) || DEFAULT_CONTEXT.viewportHeight;
    setContext(newContext);

    if (value) setInputValue(value);
    if (unit && units.includes(unit)) setInputUnit(unit);

    setUrl(window.location.href);
  }, []);

  const updateUrl = (value: string, unit: CSSUnit, ctx: ConversionContext) => {
    const newUrl = buildUrl(value, unit, ctx);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    updateUrl(value, inputUnit, context);
  };

  const handleUnitChange = (unit: CSSUnit) => {
    setInputUnit(unit);
    updateUrl(inputValue, unit, context);
  };

  const handleContextChange = (key: keyof ConversionContext, value: number) => {
    const newContext = { ...context, [key]: value };
    setContext(newContext);
    updateUrl(inputValue, inputUnit, newContext);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleReset = () => {
    setInputValue("16");
    setInputUnit("px");
    setContext(DEFAULT_CONTEXT);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  // Calculate all conversions
  const numValue = parseFloat(inputValue) || 0;
  const pxValue = convertToPx(numValue, inputUnit, context);
  const conversions = units.map((unit) => ({
    unit,
    value: formatNumber(convertFromPx(pxValue, unit, context)),
  }));

  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name.toUpperCase()} — CSS UNIT</title>
        <meta name="description" content="Convert between CSS units: px, rem, em, %, vh, vw, pt, cm, mm, in." />
        <meta property="og:title" content="CSS Unit Converter" />
        <meta property="og:description" content="Convert between CSS units: px, rem, em, %, vh, vw, pt, cm, mm, in." />
        <meta property="og:url" content="https://hypothesis.sh/css-unit" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="CSS Unit Converter" />
        <meta name="twitter:description" content="Convert between CSS units: px, rem, em, %, vh, vw, pt, cm, mm, in." />
        <link rel="canonical" href="https://hypothesis.sh/css-unit" />
      </Head>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/css-unit"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>CSS Unit</h1>
        <p className={styles.tagline}>Convert between CSS units</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputSection}>
        <div className={styles.inputHeader}>
          <span className={styles.inputLabel}>Input Value</span>
          <span className={styles.badge}>{inputUnit}</span>
        </div>
        <input
          type="number"
          className={styles.valueInput}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter value"
          step="any"
        />
        <div className={styles.unitPills}>
          {units.map((unit) => (
            <button
              key={unit}
              className={`${styles.unitPill} ${inputUnit === unit ? styles.active : ""}`}
              onClick={() => handleUnitChange(unit)}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.contextSection}>
        <div className={styles.contextRow}>
          <label className={styles.contextLabel}>
            Base Font Size:
            <input
              type="number"
              className={styles.contextInput}
              value={context.baseFontSize}
              onChange={(e) => handleContextChange("baseFontSize", parseFloat(e.target.value) || 16)}
              min="1"
              step="1"
            />
            <span className={styles.contextUnit}>px</span>
          </label>
          <label className={styles.contextLabel}>
            Viewport Width:
            <input
              type="number"
              className={styles.contextInput}
              value={context.viewportWidth}
              onChange={(e) => handleContextChange("viewportWidth", parseFloat(e.target.value) || 1920)}
              min="1"
              step="1"
            />
            <span className={styles.contextUnit}>px</span>
          </label>
          <label className={styles.contextLabel}>
            Viewport Height:
            <input
              type="number"
              className={styles.contextInput}
              value={context.viewportHeight}
              onChange={(e) => handleContextChange("viewportHeight", parseFloat(e.target.value) || 1080)}
              min="1"
              step="1"
            />
            <span className={styles.contextUnit}>px</span>
          </label>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.conversionsSection}>
        <h2 className={styles.sectionTitle}>Conversions</h2>
        <div className={styles.conversionsGrid}>
          {conversions.map(({ unit, value }) => (
            <div key={unit} className={`${styles.conversionCard} ${unit === inputUnit ? styles.active : ""}`}>
              <div className={styles.conversionUnit}>{unit}</div>
              <div className={styles.conversionValue}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow}>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
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
