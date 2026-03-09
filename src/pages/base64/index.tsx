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
  const plainRef = useRef<HTMLTextAreaElement>(null);

  const buildUrl = (enc: string, json: boolean) => {
    if (!enc) return `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({ value: enc });
    if (json) params.set("json", "1");
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    const jsonParam = params.get("json") === "1";

    if (value) {
      setEncoded(value);
      try {
        const decoded = decodeURIComponent(escape(atob(value)));
        setPlain(decoded);
        if (jsonParam) {
          try {
            JSON.parse(decoded);
            setJsonValid(true);
          } catch {
            setJsonValid(false);
          }
        }
      } catch {
        setPlain("");
      }
    }
    if (jsonParam) setJsonMode(true);
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
    const newUrl = buildUrl(enc, jsonMode);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleEncodedChange = (value: string) => {
    setEncoded(value);
    let decoded = "";
    try {
      decoded = decodeURIComponent(escape(atob(value)));
      setPlain(decoded);
    } catch {
      setPlain("");
    }
    if (jsonMode) validateJson(decoded);
    const newUrl = buildUrl(value, jsonMode);
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
    const newUrl = buildUrl(encoded, next);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handlePlainKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!jsonMode || e.key !== "Tab") return;
    e.preventDefault();

    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    if (!e.shiftKey) {
      const newVal = val.slice(0, start) + "  " + val.slice(end);
      handlePlainChange(newVal);
      requestAnimationFrame(() => {
        if (plainRef.current) {
          plainRef.current.selectionStart = plainRef.current.selectionEnd =
            start + 2;
        }
      });
    } else {
      const lineStart = val.lastIndexOf("\n", start - 1) + 1;
      const stripped = val.slice(lineStart).match(/^ {1,2}/)?.[0] ?? "";
      if (stripped.length > 0) {
        const newVal =
          val.slice(0, lineStart) + val.slice(lineStart + stripped.length);
        handlePlainChange(newVal);
        requestAnimationFrame(() => {
          if (plainRef.current) {
            const pos = Math.max(lineStart, start - stripped.length);
            plainRef.current.selectionStart = plainRef.current.selectionEnd =
              pos;
          }
        });
      }
    }
  };

  const handleReset = () => {
    setPlain("");
    setEncoded("");
    setJsonMode(false);
    setJsonValid(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
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
                plain.length > 0 &&
                (jsonValid ? (
                  <span className={styles.badge}>valid</span>
                ) : (
                  <span className={styles.badgeError}>invalid</span>
                ))
              ) : (
                <span className={styles.badge}>{plain.length} chars</span>
              )}
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              ref={plainRef}
              className={styles.textarea}
              value={plain}
              onChange={(e) => handlePlainChange(e.target.value)}
              onKeyDown={handlePlainKeyDown}
              placeholder={`Type or paste ${jsonMode ? "JSON" : "plain text"} here...`}
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
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
