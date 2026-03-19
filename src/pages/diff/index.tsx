import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/diff.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { diffLines, diffWords, diffChars } from "diff";

type Mode = "lines" | "words" | "chars";

const MODES: { value: Mode; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "words", label: "Words" },
  { value: "chars", label: "Chars" },
];

function computeDiff(original: string, modified: string, mode: Mode) {
  if (mode === "lines") return diffLines(original, modified);
  if (mode === "words") return diffWords(original, modified);
  return diffChars(original, modified);
}

export default function DiffPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [mode, setMode] = useState<Mode>("lines");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const changes = computeDiff(original, modified, mode);

  const added = changes.filter((c) => c.added).reduce((n, c) => {
    if (mode === "lines") return n + c.value.split("\n").filter((l) => l.length > 0).length;
    return n + 1;
  }, 0);
  const removed = changes.filter((c) => c.removed).reduce((n, c) => {
    if (mode === "lines") return n + c.value.split("\n").filter((l) => l.length > 0).length;
    return n + 1;
  }, 0);

  const buildUrl = (a: string, b: string, m: Mode) => {
    if (!a && !b) return `${window.location.origin}${window.location.pathname}`;
    const payload = JSON.stringify({ a, b, m });
    const encoded = btoa(unescape(encodeURIComponent(payload)));
    return `${window.location.origin}${window.location.pathname}?v=${encoded}`;
  };

  const syncUrl = (a: string, b: string, m: Mode) => {
    const newUrl = buildUrl(a, b, m);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("v");
    if (encoded) {
      try {
        const payload = JSON.parse(decodeURIComponent(escape(atob(encoded))));
        if (typeof payload.a === "string") setOriginal(payload.a);
        if (typeof payload.b === "string") setModified(payload.b);
        if (payload.m === "lines" || payload.m === "words" || payload.m === "chars")
          setMode(payload.m);
      } catch {
        // invalid, ignore
      }
    }
    setUrl(window.location.href);
  }, []);

  const handleOriginalChange = (v: string) => {
    setOriginal(v);
    syncUrl(v, modified, mode);
  };

  const handleModifiedChange = (v: string) => {
    setModified(v);
    syncUrl(original, v, mode);
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    syncUrl(original, modified, m);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleReset = () => {
    setOriginal("");
    setModified("");
    setMode("lines");
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const isEmpty = !original && !modified;

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — TEXT DIFF`}</title>
        <meta name="description" content="Compare two blocks of text and highlight additions and deletions line by line." />
        <meta property="og:title" content="Text Diff" />
        <meta property="og:description" content="Compare two blocks of text and highlight additions and deletions line by line." />
        <meta property="og:url" content="https://hypothesis.sh/diff" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Text Diff" />
        <meta name="twitter:description" content="Compare two blocks of text and highlight additions and deletions line by line." />
        <link rel="canonical" href="https://hypothesis.sh/diff" />
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
          <Link href="/docs/diff" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Text Diff</h1>
        <p className={styles.tagline}>Compare two blocks of text and highlight additions and deletions</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputs}>
        <div className={styles.inputPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Original</span>
          </div>
          <textarea
            className={styles.textarea}
            value={original}
            onChange={(e) => handleOriginalChange(e.target.value)}
            placeholder="Paste original text here…"
            spellCheck={false}
          />
        </div>
        <div className={styles.inputPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Modified</span>
          </div>
          <textarea
            className={styles.textarea}
            value={modified}
            onChange={(e) => handleModifiedChange(e.target.value)}
            placeholder="Paste modified text here…"
            spellCheck={false}
          />
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.modeGroup}>
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.modeBtn}${mode === value ? ` ${styles.modeBtnActive}` : ""}`}
              onClick={() => handleModeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {!isEmpty && (
          <div className={styles.stats}>
            <span className={styles.statAdded}>+{added} {mode === "lines" ? "lines" : mode === "words" ? "words" : "chars"}</span>
            <span className={styles.statRemoved}>−{removed} {mode === "lines" ? "lines" : mode === "words" ? "words" : "chars"}</span>
          </div>
        )}
      </div>

      <div className={styles.output}>
        {isEmpty ? (
          <span className={styles.placeholder}>Paste text into both fields above to see the diff.</span>
        ) : changes.length === 0 || changes.every((c) => !c.added && !c.removed) ? (
          <span className={styles.identical}>Texts are identical.</span>
        ) : (
          <pre className={styles.diffPre}>
            {changes.map((change, i) => (
              <span
                key={i}
                className={
                  change.added
                    ? styles.added
                    : change.removed
                    ? styles.removed
                    : styles.unchanged
                }
              >
                {change.value}
              </span>
            ))}
          </pre>
        )}
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
