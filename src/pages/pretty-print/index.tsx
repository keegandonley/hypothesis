import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/pretty-print.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

const URL_LIMIT = 2000;

export default function PrettyPrintPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);
  const [url, setUrl] = useState("");
  const [urlTooLong, setUrlTooLong] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (encoded: string) => {
    if (!encoded) return `${window.location.origin}${window.location.pathname}`;
    return `${window.location.origin}${window.location.pathname}?v=${encoded}`;
  };

  const formatJson = (value: string): { output: string; valid: boolean | null } => {
    if (value.length === 0) return { output: "", valid: null };
    try {
      const parsed = JSON.parse(value);
      return { output: JSON.stringify(parsed, null, 2), valid: true };
    } catch {
      return { output: "", valid: false };
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    if (v) {
      try {
        const decoded = decodeURIComponent(escape(atob(v)));
        const { output: fmt, valid } = formatJson(decoded);
        setInput(decoded);
        setOutput(fmt);
        setJsonValid(valid);
      } catch {
        /* ignore bad param */
      }
    }
    const currentUrl = window.location.href;
    setUrl(currentUrl);
    setUrlTooLong(currentUrl.length > URL_LIMIT);
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    const { output: fmt, valid } = formatJson(value);
    setOutput(fmt);
    setJsonValid(valid);
    const encoded = value ? btoa(unescape(encodeURIComponent(value))) : "";
    const newUrl = buildUrl(encoded);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
    setUrlTooLong(newUrl.length > URL_LIMIT);
  };

  const handleReset = () => {
    setInput("");
    setOutput("");
    setJsonValid(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
    setUrlTooLong(false);
  };

  const handleCopy = () => {
    if (urlTooLong) return;
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleCopyOutput = () => {
    copyToClipboard(output);
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name.toUpperCase()} — PRETTY PRINT</title>
      </Head>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/pretty-print"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Pretty Print</h1>
        <p className={styles.tagline}>Format and validate JSON</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Input</span>
            <div className={styles.panelHeaderRight}>
              <span className={styles.badge}>{input.length} chars</span>
              {jsonValid === true && <span className={styles.badge}>valid</span>}
              {jsonValid === false && <span className={styles.badgeError}>invalid</span>}
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste JSON here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Formatted</span>
            <span className={styles.badge}>{output.length} chars</span>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={output}
              readOnly
              placeholder="Formatted output appears here..."
              spellCheck={false}
            />
            {output.length > 0 && !isIframe && (
              <button className={styles.formatBtn} onClick={handleCopyOutput}>
                Copy
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow}>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={`${styles.permalinkUrl}${urlTooLong ? ` ${styles.permalinkDisabled}` : ""}`}>
          {urlTooLong ? "url too long to share" : url}
        </span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}${urlTooLong ? ` ${styles.copyBtnDisabled}` : ""}`}
            onClick={handleCopy}
            disabled={urlTooLong}
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
