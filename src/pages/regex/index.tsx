import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/regex.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";

const FLAGS = ["g", "i", "m", "s", "u"] as const;
type Flag = (typeof FLAGS)[number];

interface ResultRow {
  input: string;
  matched: boolean;
  matchCount: number;
  groups: string[];
}

function computeResults(
  pattern: string,
  flagStr: string,
  testInput: string,
): ResultRow[] {
  if (!pattern) return [];
  try {
    new RegExp(pattern, flagStr);
  } catch {
    return [];
  }

  const globalFlags = flagStr.includes("g") ? flagStr : flagStr + "g";
  const lines = testInput.split("\n");
  return lines.map((line) => {
    const matches = Array.from(line.matchAll(new RegExp(pattern, globalFlags)));
    return {
      input: line,
      matched: matches.length > 0,
      matchCount: matches.length,
      groups: matches.flatMap((m) => m.slice(1).filter(Boolean) as string[]),
    };
  });
}

function getPatternStatus(
  pattern: string,
  flagStr: string,
  results: ResultRow[],
): { label: string; type: "badge" | "badgeError" | "badgeReady" | null } {
  if (!pattern) return { label: "ready", type: "badgeReady" };
  try {
    new RegExp(pattern, flagStr);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid";
    return { label: `error: ${msg}`, type: "badgeError" };
  }
  const matchCount = results.filter((r) => r.matched).length;
  const total = results.filter((r) => r.input !== "").length;
  if (total === 0) return { label: "valid", type: "badge" };
  return { label: `${matchCount}/${total} match`, type: "badge" };
}

export default function RegexPage() {
  const branding = useBranding();
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Record<Flag, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });
  const [testInput, setTestInput] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flagStr = FLAGS.filter((f) => flags[f]).join("");

  const buildUrl = (p: string, f: string, s: string) => {
    if (!p && !s) return `${window.location.origin}${window.location.pathname}`;
    const payload = btoa(
      unescape(encodeURIComponent(JSON.stringify({ p, f, s }))),
    );
    return `${window.location.origin}${window.location.pathname}?v=${payload}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("v");
    if (raw) {
      try {
        const { p, f, s } = JSON.parse(decodeURIComponent(escape(atob(raw))));
        if (typeof p === "string") setPattern(p);
        if (typeof s === "string") setTestInput(s);
        if (typeof f === "string") {
          setFlags({
            g: f.includes("g"),
            i: f.includes("i"),
            m: f.includes("m"),
            s: f.includes("s"),
            u: f.includes("u"),
          });
        }
      } catch {
        /* ignore */
      }
    }
    setUrl(window.location.href);
  }, []);

  const updateUrl = (p: string, f: string, s: string) => {
    const newUrl = buildUrl(p, f, s);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handlePatternChange = (value: string) => {
    setPattern(value);
    updateUrl(value, flagStr, testInput);
  };

  const handleFlagToggle = (flag: Flag) => {
    const newFlags = { ...flags, [flag]: !flags[flag] };
    setFlags(newFlags);
    const newFlagStr = FLAGS.filter((f) => newFlags[f]).join("");
    updateUrl(pattern, newFlagStr, testInput);
  };

  const handleTestInputChange = (value: string) => {
    setTestInput(value);
    updateUrl(pattern, flagStr, value);
  };

  const handleReset = () => {
    setPattern("");
    setFlags({ g: true, i: false, m: false, s: false, u: false });
    setTestInput("");
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

  const results = computeResults(pattern, flagStr, testInput);
  const status = getPatternStatus(pattern, flagStr, results);
  const lineCount = testInput.split("\n").length;

  return (
    <div className={styles.page}>
      <Head>
        <title>regex — {branding.name}</title>
      </Head>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.domainLink}
          >
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/regex"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Regex Tester</h1>
        <p className={styles.tagline}>
          Test regular expressions against strings with live match results
        </p>
      </div>

      <hr className={styles.divider} />

      {/* Pattern panel */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelLabel}>Pattern</span>
          <div className={styles.panelHeaderRight}>
            {status.type && (
              <span className={styles[status.type]}>{status.label}</span>
            )}
          </div>
        </div>
        <div className={styles.patternInputRow}>
          <span className={styles.regexSlash}>/</span>
          <input
            type="text"
            className={styles.patternInput}
            value={pattern}
            onChange={(e) => handlePatternChange(e.target.value)}
            placeholder="pattern"
            spellCheck={false}
            autoComplete="off"
          />
          <span className={styles.regexSlash}>/</span>
          <div className={styles.flagsGroup}>
            {FLAGS.map((flag) => (
              <button
                key={flag}
                className={`${styles.flagBtn}${flags[flag] ? ` ${styles.flagActive}` : ""}`}
                onClick={() => handleFlagToggle(flag)}
                title={flagTitle(flag)}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Test strings + Results */}
      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Test Strings</span>
            <span className={styles.badge}>
              {lineCount} line{lineCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={testInput}
              onChange={(e) => handleTestInputChange(e.target.value)}
              placeholder={"Enter test strings, one per line..."}
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Results</span>
          </div>
          <div className={styles.resultsPanel}>
            {!pattern ? (
              <div className={styles.emptyState}>
                Enter a pattern to see results
              </div>
            ) : status.type === "badgeError" ? (
              <div className={styles.emptyState}>
                Fix the pattern error to see results
              </div>
            ) : results.filter((r) => r.input !== "").length === 0 ? (
              <div className={styles.emptyState}>
                Enter test strings to see results
              </div>
            ) : (
              results
                .filter((r) => r.input !== "")
                .map((row, i) => (
                  <div key={i} className={styles.resultRow}>
                    <div className={styles.resultTop}>
                      <span className={styles.resultString}>{row.input}</span>
                      {row.matched ? (
                        <span className={styles.matchBadge}>
                          {row.matchCount} match
                          {row.matchCount !== 1 ? "es" : ""}
                        </span>
                      ) : (
                        <span className={styles.noMatchBadge}>no match</span>
                      )}
                    </div>
                    {row.groups.length > 0 && (
                      <div className={styles.groupChips}>
                        {row.groups.map((g, j) => (
                          <span key={j} className={styles.groupChip}>
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
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

function flagTitle(flag: Flag): string {
  switch (flag) {
    case "g":
      return "global — find all matches";
    case "i":
      return "ignore case";
    case "m":
      return "multiline — ^ and $ match line boundaries";
    case "s":
      return "dotAll — . matches newlines";
    case "u":
      return "unicode";
  }
}
