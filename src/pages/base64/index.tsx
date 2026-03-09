import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/base64.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";

export default function Base64Page() {
  const branding = useBranding();
  const [plain, setPlain] = useState("");
  const [encoded, setEncoded] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    if (value) {
      setEncoded(value);
      try {
        setPlain(decodeURIComponent(escape(atob(value))));
      } catch {
        setPlain("");
      }
    }
    setUrl(window.location.href);
  }, []);

  const validateJson = (value: string) => {
    if (value.length === 0) {
      setJsonValid(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonValid(true);
    } catch {
      setJsonValid(false);
    }
  };

  const handlePlainChange = (value: string) => {
    setPlain(value);
    if (jsonMode) validateJson(value);
    const enc = btoa(unescape(encodeURIComponent(value)));
    setEncoded(enc);
    const newUrl = value
      ? `${window.location.origin}${window.location.pathname}?value=${enc}`
      : `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleEncodedChange = (value: string) => {
    setEncoded(value);
    try {
      setPlain(decodeURIComponent(escape(atob(value))));
    } catch {
      setPlain("");
    }
    const newUrl = value
      ? `${window.location.origin}${window.location.pathname}?value=${value}`
      : `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(plain), null, 2);
      handlePlainChange(formatted);
    } catch {
      /* no-op */
    }
  };

  const handleJsonToggle = () => {
    const next = !jsonMode;
    setJsonMode(next);
    if (next) validateJson(plain);
    else setJsonValid(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>base64 — {branding.name}</title>
      </Head>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          {branding.domain} |{" "}
          <Link
            href="/docs/base64"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Base64</h1>
        <p className={styles.tagline}>Encode and decode base64 strings</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>
              {jsonMode ? "JSON" : "Plain Text"}
            </span>
            <div className={styles.panelHeaderRight}>
              <button
                className={`${styles.toggleBtn}${jsonMode ? ` ${styles.active}` : ""}`}
                onClick={handleJsonToggle}
              >
                JSON Mode {jsonMode ? "ON" : "OFF"}
              </button>
              {jsonMode ? (
                plain.length > 0 && (
                  jsonValid
                    ? <span className={styles.badge}>valid</span>
                    : <span className={styles.badgeError}>invalid</span>
                )
              ) : (
                <span className={styles.badge}>{plain.length} chars</span>
              )}
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={plain}
              onChange={(e) => handlePlainChange(e.target.value)}
              placeholder="Type plain text here..."
              spellCheck={false}
            />
            {jsonMode && (
              <button
                className={styles.formatBtn}
                disabled={!jsonValid}
                onClick={handleFormat}
              >
                Format
              </button>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Base64</span>
            <span className={styles.badge}>{encoded.length} chars</span>
          </div>
          <textarea
            className={styles.textarea}
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Paste base64 here..."
            spellCheck={false}
          />
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow}>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        <button
          className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
