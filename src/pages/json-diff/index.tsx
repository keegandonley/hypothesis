import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/json-diff.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

type DiffType = "added" | "removed" | "changed" | "type-changed";

interface DiffEntry {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
}

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function jsonDiff(a: unknown, b: unknown, path = ""): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const label = path || "(root)";

  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  const aIsObj = a !== null && typeof a === "object" && !aIsArray;
  const bIsObj = b !== null && typeof b === "object" && !bIsArray;

  if (typeof a !== typeof b || aIsArray !== bIsArray) {
    entries.push({ path: label, type: "type-changed", oldValue: a, newValue: b });
    return entries;
  }

  if (aIsArray && bIsArray) {
    const aArr = a as unknown[];
    const bArr = b as unknown[];
    const len = Math.max(aArr.length, bArr.length);
    for (let i = 0; i < len; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= aArr.length) {
        entries.push({ path: childPath, type: "added", newValue: bArr[i] });
      } else if (i >= bArr.length) {
        entries.push({ path: childPath, type: "removed", oldValue: aArr[i] });
      } else {
        entries.push(...jsonDiff(aArr[i], bArr[i], childPath));
      }
    }
    return entries;
  }

  if (aIsObj && bIsObj) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
    for (const key of keys) {
      const childPath = path ? `${path}.${key}` : key;
      if (!(key in aObj)) {
        entries.push({ path: childPath, type: "added", newValue: bObj[key] });
      } else if (!(key in bObj)) {
        entries.push({ path: childPath, type: "removed", oldValue: aObj[key] });
      } else {
        entries.push(...jsonDiff(aObj[key], bObj[key], childPath));
      }
    }
    return entries;
  }

  if (a !== b) {
    entries.push({ path: label, type: "changed", oldValue: a, newValue: b });
  }
  return entries;
}

const DIFF_LABELS: Record<DiffType, string> = {
  added: "+ added",
  removed: "- removed",
  changed: "~ changed",
  "type-changed": "! type",
};

export default function JsonDiffPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [leftError, setLeftError] = useState("");
  const [rightError, setRightError] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let diff: DiffEntry[] = [];
  let canDiff = false;
  let leftParsed: unknown;
  let rightParsed: unknown;
  let leftOk = false;
  let rightOk = false;

  if (left) {
    try { leftParsed = JSON.parse(left); leftOk = true; } catch { leftOk = false; }
  }
  if (right) {
    try { rightParsed = JSON.parse(right); rightOk = true; } catch { rightOk = false; }
  }

  canDiff = (left.length > 0 || right.length > 0) && leftOk && rightOk;
  if (canDiff) diff = jsonDiff(leftParsed, rightParsed);

  const counts = {
    added: diff.filter((d) => d.type === "added").length,
    removed: diff.filter((d) => d.type === "removed").length,
    changed: diff.filter((d) => d.type === "changed" || d.type === "type-changed").length,
  };

  const buildUrl = (l: string, r: string) => {
    if (!l && !r) return `${window.location.origin}${window.location.pathname}`;
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({ l, r }))));
    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    if (v) {
      try {
        const payload = JSON.parse(decodeURIComponent(escape(atob(v))));
        if (typeof payload.l === "string") setLeft(payload.l);
        if (typeof payload.r === "string") setRight(payload.r);
      } catch {
        // ignore
      }
    }
    setUrl(window.location.href);
  }, []);

  const syncUrl = (l: string, r: string) => {
    const newUrl = buildUrl(l, r);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleLeft = (v: string) => {
    setLeft(v);
    if (v) {
      try { JSON.parse(v); setLeftError(""); } catch { setLeftError("Invalid JSON"); }
    } else {
      setLeftError("");
    }
    syncUrl(v, right);
  };

  const handleRight = (v: string) => {
    setRight(v);
    if (v) {
      try { JSON.parse(v); setRightError(""); } catch { setRightError("Invalid JSON"); }
    } else {
      setRightError("");
    }
    syncUrl(left, v);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleReset = () => {
    setLeft("");
    setRight("");
    setLeftError("");
    setRightError("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — JSON Diff`}</title>
        <meta
          name="description"
          content="Compare two JSON structures and highlight added, removed, and changed keys."
        />
        <meta property="og:title" content="JSON Diff" />
        <meta
          property="og:description"
          content="Compare two JSON structures and highlight added, removed, and changed keys."
        />
        <meta property="og:url" content="https://hypothesis.sh/json-diff" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="JSON Diff" />
        <meta
          name="twitter:description"
          content="Compare two JSON structures and highlight added, removed, and changed keys."
        />
        <link rel="canonical" href="https://hypothesis.sh/json-diff" />
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
            href="/docs/json-diff"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>JSON Diff</h1>
        <p className={styles.tagline}>
          Compare two JSON structures and highlight structural differences
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.body}>
        <div className={styles.inputs}>
          <div className={styles.inputPanel}>
            <div className={styles.inputHeader}>
              <span className={styles.inputLabel}>JSON A</span>
              {leftError && <span className={styles.error}>{leftError}</span>}
            </div>
            <textarea
              className={styles.textarea}
              value={left}
              onChange={(e) => handleLeft(e.target.value)}
              placeholder={'{\n  "name": "Alice",\n  "age": 30\n}'}
              spellCheck={false}
            />
          </div>
          <div className={styles.inputPanel}>
            <div className={styles.inputHeader}>
              <span className={styles.inputLabel}>JSON B</span>
              {rightError && <span className={styles.error}>{rightError}</span>}
            </div>
            <textarea
              className={styles.textarea}
              value={right}
              onChange={(e) => handleRight(e.target.value)}
              placeholder={'{\n  "name": "Alice",\n  "age": 31,\n  "city": "NYC"\n}'}
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.diffPanel}>
          <div className={styles.diffHeader}>
            <span className={styles.diffTitle}>Differences</span>
            {canDiff && (
              <div className={styles.diffSummary}>
                {counts.added > 0 && (
                  <span className={`${styles.badge} ${styles.badgeAdded}`}>
                    +{counts.added} added
                  </span>
                )}
                {counts.removed > 0 && (
                  <span className={`${styles.badge} ${styles.badgeRemoved}`}>
                    -{counts.removed} removed
                  </span>
                )}
                {counts.changed > 0 && (
                  <span className={`${styles.badge} ${styles.badgeChanged}`}>
                    ~{counts.changed} changed
                  </span>
                )}
                {diff.length === 0 && (
                  <span className={`${styles.badge} ${styles.badgeEqual}`}>
                    identical
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={styles.diffList}>
            {!left && !right && (
              <span className={styles.emptyHint}>Paste JSON into both panels to compare</span>
            )}
            {(leftError || rightError) && (
              <span className={styles.emptyHint}>Fix JSON errors to compare</span>
            )}
            {canDiff && diff.length === 0 && (
              <span className={styles.emptyHint}>No differences found — the two JSON values are identical</span>
            )}
            {diff.map((entry, i) => (
              <div key={i} className={`${styles.diffEntry} ${styles[entry.type]}`}>
                <span className={styles.diffBadge}>{DIFF_LABELS[entry.type]}</span>
                <span className={styles.diffPath}>{entry.path}</span>
                <div className={styles.diffValues}>
                  {entry.oldValue !== undefined && (
                    <span className={styles.diffOld}>{formatValue(entry.oldValue)}</span>
                  )}
                  {entry.oldValue !== undefined && entry.newValue !== undefined && (
                    <span className={styles.arrow}>→</span>
                  )}
                  {entry.newValue !== undefined && (
                    <span className={styles.diffNew}>{formatValue(entry.newValue)}</span>
                  )}
                </div>
              </div>
            ))}
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
