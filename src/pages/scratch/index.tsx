import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import LZString from "lz-string";
import styles from "../../styles/scratch.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

export default function ScratchPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("text");
    if (value) setText(LZString.decompressFromEncodedURIComponent(value) ?? "");
    setUrl(window.location.href);
  }, []);

  const handleChange = (value: string) => {
    setText(value);
    const newUrl = value
      ? `${window.location.origin}${window.location.pathname}?text=${LZString.compressToEncodedURIComponent(value)}`
      : `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleReset = () => {
    setText("");
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
      <Head>
        <title>{`${branding.name.toUpperCase()} — SCRATCH`}</title>
        <meta name="description" content="A scratchpad — bookmark text snippets via permalink." />
        <meta property="og:title" content="Scratch" />
        <meta property="og:description" content="A scratchpad — bookmark text snippets via permalink." />
        <meta property="og:url" content="https://hypothesis.sh/scratch" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Scratch" />
        <meta name="twitter:description" content="A scratchpad — bookmark text snippets via permalink." />
        <link rel="canonical" href="https://hypothesis.sh/scratch" />
      </Head>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/scratch"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Scratch</h1>
        <p className={styles.tagline}>Type anything — copy the permalink to bookmark it</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.textareaWrapper}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Start typing..."
          spellCheck={false}
          autoFocus
        />
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
