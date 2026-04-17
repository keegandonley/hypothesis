import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/keycode.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

const LOCATION_NAMES: Record<number, string> = {
  0: "Standard",
  1: "Left",
  2: "Right",
  3: "Numpad",
};

export default function KeycodePage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUrl(window.location.href);
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeyInfo({
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        location: e.location,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const modifiers = keyInfo
    ? [
        keyInfo.ctrlKey && "Ctrl",
        keyInfo.shiftKey && "Shift",
        keyInfo.altKey && "Alt",
        keyInfo.metaKey && "Meta",
      ].filter(Boolean as unknown as <T>(x: T | false) => x is T)
    : [];

  const isSpecialKey = keyInfo && keyInfo.key.length > 1;
  const displayKey = keyInfo
    ? keyInfo.key === " "
      ? "Space"
      : keyInfo.key
    : null;

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
        <title>{`${branding.name.toUpperCase()} — Keycode`}</title>
        <meta
          name="description"
          content="Press any key to inspect its JavaScript event properties: key, code, keyCode, location, and modifier state."
        />
        <meta property="og:title" content="Keycode Inspector" />
        <meta
          property="og:description"
          content="Press any key to inspect its JavaScript event properties."
        />
        <meta property="og:url" content="https://hypothesis.sh/keycode" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Keycode Inspector" />
        <meta
          name="twitter:description"
          content="Press any key to inspect its JavaScript event properties."
        />
        <link rel="canonical" href="https://hypothesis.sh/keycode" />
      </Head>

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
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
            href="/docs/keycode"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Keycode</h1>
        <p className={styles.tagline}>
          Press any key to inspect its JavaScript event properties
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.body}>
        <div className={styles.keyDisplay}>
          {displayKey ? (
            <span
              className={`${styles.keyChar} ${isSpecialKey ? styles.keySpecial : ""}`}
            >
              {displayKey}
            </span>
          ) : (
            <span className={styles.keyPrompt}>press any key</span>
          )}
        </div>

        <div className={styles.table}>
          <div className={styles.row}>
            <span className={styles.label}>key</span>
            <span className={styles.value}>
              {keyInfo ? (keyInfo.key === " " ? '" "' : keyInfo.key) : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>code</span>
            <span className={styles.value}>{keyInfo?.code ?? "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>keyCode</span>
            <span className={styles.value}>
              {keyInfo != null ? keyInfo.keyCode : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>which</span>
            <span className={styles.value}>
              {keyInfo != null ? keyInfo.which : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>location</span>
            <span className={styles.value}>
              {keyInfo != null
                ? `${LOCATION_NAMES[keyInfo.location] ?? keyInfo.location} (${keyInfo.location})`
                : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>modifiers</span>
            <span className={styles.value}>
              {keyInfo
                ? modifiers.length > 0
                  ? modifiers.join(" + ")
                  : "none"
                : "—"}
            </span>
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
      </div>
    </div>
  );
}
