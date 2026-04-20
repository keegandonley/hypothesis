import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/urlencode.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { ReferenceLinks } from "@/components/ReferenceLinks";

export default function UrlEncodePage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [decoded, setDecoded] = useState("");
  const [encoded, setEncoded] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [uriMode, setUriMode] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (dec: string, uri: boolean) => {
    if (!dec) return `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({ value: dec });
    if (uri) params.set("mode", "uri");
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    const uriParam = params.get("mode") === "uri";

    if (value) {
      setDecoded(value);
      const enc = uriParam ? encodeURI(value) : encodeURIComponent(value);
      setEncoded(enc);
    }
    if (uriParam) setUriMode(true);
    setUrl(window.location.href);
  }, []);

  const handleDecodedChange = (value: string) => {
    setDecoded(value);
    const enc = uriMode ? encodeURI(value) : encodeURIComponent(value);
    setEncoded(enc);
    const newUrl = buildUrl(value, uriMode);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleEncodedChange = (value: string) => {
    setEncoded(value);
    try {
      const dec = decodeURIComponent(value);
      setDecoded(dec);
    } catch {
      setDecoded("");
    }
    const newUrl = buildUrl(decoded, uriMode);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleUriToggle = () => {
    const next = !uriMode;
    setUriMode(next);
    const enc = next ? encodeURI(decoded) : encodeURIComponent(decoded);
    setEncoded(enc);
    const newUrl = buildUrl(decoded, next);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleReset = () => {
    setDecoded("");
    setEncoded("");
    setUriMode(false);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="URL Encoder / Decoder"
        description="Encode and decode URL components and query strings online. Free online URL encoder/decoder — no installation required. No data sent to servers."
        path="/urlencode"
        brandName={branding.name}
      />
      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/urlencode"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>URL Encode</h1>
        <p className={styles.tagline}>Encode and decode URL strings</p>
        <ReferenceLinks refs={[{ name: "MIME Types", slug: "mime-types" }, { name: "HTTP Headers", slug: "http-headers" }]} />
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>
              {uriMode ? "URI" : "Decoded"}
            </span>
            <div className={styles.panelHeaderRight}>
              <button
                className={`${styles.toggleBtn}${uriMode ? ` ${styles.active}` : ""}`}
                onClick={handleUriToggle}
              >
                URI Mode {uriMode ? "ON" : "OFF"}
              </button>
              <span className={styles.badge}>{decoded.length} chars</span>
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={decoded}
              onChange={(e) => handleDecodedChange(e.target.value)}
              placeholder="Type or paste text here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>URL Encoded</span>
            <span className={styles.badge}>{encoded.length} chars</span>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={encoded}
              onChange={(e) => handleEncodedChange(e.target.value)}
              placeholder="Paste encoded string here..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
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
