import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/numbase.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

type Values = { bin: string; oct: string; dec: string; hex: string };

const empty: Values = { bin: "", oct: "", dec: "", hex: "" };

function fromDecimal(n: number): Values {
  return {
    bin: n.toString(2),
    oct: n.toString(8),
    dec: n.toString(10),
    hex: n.toString(16).toUpperCase(),
  };
}

export default function NumbasePage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [values, setValues] = useState<Values>(empty);
  const [errorField, setErrorField] = useState<keyof Values | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<keyof Values | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyFieldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (dec: string) => {
    if (!dec) return `${window.location.origin}${window.location.pathname}`;
    return `${window.location.origin}${window.location.pathname}?value=${dec}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    if (value) {
      const n = parseInt(value, 10);
      if (!isNaN(n)) setValues(fromDecimal(n));
    }
    setUrl(window.location.href);
  }, []);

  const handleChange = (raw: string, field: keyof Values, base: number) => {
    const trimmed = raw.trim();

    // Always reflect what was typed in the active field
    setValues((prev) => ({ ...prev, [field]: raw }));

    if (!trimmed) {
      setValues(empty);
      setErrorField(null);
      const newUrl = buildUrl("");
      history.replaceState(null, "", newUrl);
      setUrl(newUrl);
      return;
    }

    const n = parseInt(trimmed, base);
    if (isNaN(n) || n < 0) {
      setErrorField(field);
      return;
    }

    setErrorField(null);
    const next = fromDecimal(n);
    // Keep what the user typed for their active field
    setValues({ ...next, [field]: raw.toUpperCase() });
    const newUrl = buildUrl(next.dec);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = () => {
    setValues(empty);
    setErrorField(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleCopyField = (field: keyof Values) => {
    copyToClipboard(values[field]).then(() => {
      setCopiedField(field);
      if (copyFieldTimeoutRef.current) clearTimeout(copyFieldTimeoutRef.current);
      copyFieldTimeoutRef.current = setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const panels: {
    field: keyof Values;
    label: string;
    prefix: string;
    base: number;
    placeholder: string;
  }[] = [
    { field: "bin", label: "Binary", prefix: "0b", base: 2, placeholder: "e.g. 11111111" },
    { field: "oct", label: "Octal", prefix: "0o", base: 8, placeholder: "e.g. 377" },
    { field: "dec", label: "Decimal", prefix: "base 10", base: 10, placeholder: "e.g. 255" },
    { field: "hex", label: "Hex", prefix: "0x", base: 16, placeholder: "e.g. FF" },
  ];

  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name.toUpperCase()} — NUMBER BASE</title>
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
            href="/docs/numbase"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Number Base</h1>
        <p className={styles.tagline}>
          Convert integers between binary, octal, decimal, and hex
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        {panels.map(({ field, label, prefix, base, placeholder }) => {
          const isError = errorField === field;
          const val = values[field];
          return (
            <div key={field} className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>{label}</span>
                <div className={styles.panelHeaderRight}>
                  {isError ? (
                    <span className={styles.badgeError}>invalid</span>
                  ) : val ? (
                    <span className={styles.badge}>{val.length} digits</span>
                  ) : (
                    <span className={styles.badge}>{prefix}</span>
                  )}
                </div>
              </div>
              <div className={styles.textareaWrapper}>
                <textarea
                  className={styles.textarea}
                  value={val}
                  onChange={(e) => handleChange(e.target.value, field, base)}
                  placeholder={placeholder}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                {val && !isError && !isIframe && (
                  <button
                    className={`${styles.copyFieldBtn}${copiedField === field ? ` ${styles.copied}` : ""}`}
                    onClick={() => handleCopyField(field)}
                  >
                    {copiedField === field ? "Copied!" : "Copy"}
                  </button>
                )}
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
