import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/css-unit.module.css";
import { Badge, Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { UNITS, DEFAULT_CONTEXT, type CSSUnit, type ConversionContext, convertToPx, convertFromPx, formatNumber } from "@/lib/css-unit";

export default function CssUnitPage(): React.ReactNode {
  const [inputValue, setInputValue] = useState<string>("16");
  const [inputUnit, setInputUnit] = useState<CSSUnit>("px");
  const [context, setContext] = useState<ConversionContext>(DEFAULT_CONTEXT);
  const [copiedUnit, setCopiedUnit] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const copyUnitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (
    value: string,
    unit: CSSUnit,
    ctx: ConversionContext,
  ): string => {
    const params = new URLSearchParams({
      value,
      unit,
      base: ctx.baseFontSize.toString(),
      vw: ctx.viewportWidth.toString(),
      vh: ctx.viewportHeight.toString(),
      ps: ctx.parentSize.toString(),
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
    const ps = params.get("ps");

    const newContext = { ...DEFAULT_CONTEXT };

    if (base)
      newContext.baseFontSize =
        parseFloat(base) || DEFAULT_CONTEXT.baseFontSize;
    if (vw)
      newContext.viewportWidth =
        parseFloat(vw) || DEFAULT_CONTEXT.viewportWidth;
    if (vh)
      newContext.viewportHeight =
        parseFloat(vh) || DEFAULT_CONTEXT.viewportHeight;
    if (ps)
      newContext.parentSize = parseFloat(ps) || DEFAULT_CONTEXT.parentSize;
    setContext(newContext); // eslint-disable-line react-hooks/set-state-in-effect

    if (value) setInputValue(value);
    if (unit && UNITS.includes(unit)) setInputUnit(unit);

    setUrl(window.location.href);
  }, []);

  const updateUrl = (
    value: string,
    unit: CSSUnit,
    ctx: ConversionContext,
  ): void => {
    const newUrl = buildUrl(value, unit, ctx);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleInputChange = (value: string): void => {
    setInputValue(value);
    updateUrl(value, inputUnit, context);
  };

  const handleUnitChange = (unit: CSSUnit): void => {
    setInputUnit(unit);
    updateUrl(inputValue, unit, context);
  };

  const handleCardClick = (unit: CSSUnit, convertedValue: string): void => {
    setInputUnit(unit);
    setInputValue(convertedValue);
    updateUrl(convertedValue, unit, context);
  };

  const handleContextChange = (
    key: keyof ConversionContext,
    value: number,
  ): void => {
    const newContext = { ...context, [key]: value };

    setContext(newContext);
    updateUrl(inputValue, inputUnit, newContext);
  };

  const handleCardCopy = (unit: string, value: string): void => {
    void copyToClipboard(value).then(() => {
      setCopiedUnit(unit);
      if (copyUnitTimeoutRef.current) clearTimeout(copyUnitTimeoutRef.current);
      copyUnitTimeoutRef.current = setTimeout(() => {
        setCopiedUnit(null);
      }, 1500);
    });
  };

  const handleReset = (): void => {
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
  const conversions = UNITS.map((unit) => ({
    unit,
    value: formatNumber(convertFromPx(pxValue, unit, context)),
  }));

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="CSS Unit Converter"
        metaDescription="Convert between CSS units: px, rem, em, vw, vh, and more with a configurable root font size. Free online CSS unit converter — no installation required."
        path="/css-unit"
        h1="CSS Unit"
        tagline="Convert between CSS units"
        refs={[{ name: "CSS Selectors", slug: "css-selectors" }]}
      >

      <div className={styles.inputSection}>
        <div className={styles.inputHeader}>
          <span className={styles.inputLabel}>Input Value</span>
          <Badge>{inputUnit}</Badge>
        </div>
        <input
          type="number"
          className={styles.valueInput}
          value={inputValue}
          onChange={(e) => {
            handleInputChange(e.target.value);
          }}
          placeholder="Enter value"
          step="any"
        />
        <div className={styles.unitPills}>
          {UNITS.map((unit) => (
            <button
              key={unit}
              className={`${styles.unitPill} ${inputUnit === unit ? styles.active : ""}`}
              onClick={() => {
                handleUnitChange(unit);
              }}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.contextSection}>
        <div className={styles.contextCard}>
          <label className={styles.contextLabel}>Base Font Size</label>
          <div className={styles.contextInputRow}>
            <input
              type="number"
              className={styles.contextInput}
              value={context.baseFontSize}
              onChange={(e) => {
                handleContextChange(
                  "baseFontSize",
                  parseFloat(e.target.value) || DEFAULT_CONTEXT.baseFontSize,
                );
              }}
              min="1"
              step="1"
            />
            <span className={styles.contextUnit}>px</span>
          </div>
        </div>
        <div className={styles.contextCard}>
          <label className={styles.contextLabel}>Viewport Width</label>
          <div className={styles.contextInputRow}>
            <input
              type="number"
              className={styles.contextInput}
              value={context.viewportWidth}
              onChange={(e) => {
                handleContextChange(
                  "viewportWidth",
                  parseFloat(e.target.value) || DEFAULT_CONTEXT.viewportWidth,
                );
              }}
              min="1"
              step="1"
            />
            <span className={styles.contextUnit}>px</span>
          </div>
        </div>
        <div className={styles.contextCard}>
          <label className={styles.contextLabel}>Viewport Height</label>
          <div className={styles.contextInputRow}>
            <input
              type="number"
              className={styles.contextInput}
              value={context.viewportHeight}
              onChange={(e) => {
                handleContextChange(
                  "viewportHeight",
                  parseFloat(e.target.value) || DEFAULT_CONTEXT.viewportHeight,
                );
              }}
              min="1"
              step="1"
            />
            <span className={styles.contextUnit}>px</span>
          </div>
        </div>
        <div className={styles.contextCard}>
          <label className={styles.contextLabel}>Parent Size (for %)</label>
          <div className={styles.contextInputRow}>
            <input
              type="number"
              className={styles.contextInput}
              value={context.parentSize}
              onChange={(e) => {
                handleContextChange(
                  "parentSize",
                  parseFloat(e.target.value) || DEFAULT_CONTEXT.parentSize,
                );
              }}
              min="1"
              step="1"
            />
            <span className={styles.contextUnit}>px</span>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.conversionsSection}>
        <h2 className={styles.sectionTitle}>Conversions</h2>
        <div className={styles.conversionsGrid}>
          {conversions.map(({ unit, value }) => (
            <div
              key={unit}
              className={`${styles.conversionCard} ${unit === inputUnit ? styles.active : ""}`}
              onClick={() => {
                handleCardClick(unit, value);
              }}
            >
              <div className={styles.conversionCardHeader}>
                <div className={styles.conversionUnit}>{unit}</div>
                <button
                  className={styles.cardCopyBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardCopy(unit, value);
                  }}
                >
                  {copiedUnit === unit ? "✓" : "copy"}
                </button>
              </div>
              <div className={styles.conversionValue}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
