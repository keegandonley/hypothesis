import { useEffect, useState } from "react";
import styles from "@/styles/regex.module.css";
import { Badge, Button, CopyButton, PageLayout, Panel, PanelHeader, PanelBody, PermalinkRow } from "@/components/ui";
import { ReferenceLinks } from "@/components/ReferenceLinks";

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
      groups: matches.flatMap((m) => m.slice(1).filter(Boolean)),
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

export default function RegexPage(): React.ReactNode {
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

  const flagStr = FLAGS.filter((f) => flags[f]).join("");

  const buildUrl = (p: string, f: string, s: string): string => {
    if (!p && !s) return `${window.location.origin}${window.location.pathname}`;
    const payload = btoa(
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      unescape(encodeURIComponent(JSON.stringify({ p, f, s }))),
    );

    return `${window.location.origin}${window.location.pathname}?v=${payload}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("v");

    if (raw) {
      try {
        const parsed = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          decodeURIComponent(escape(atob(raw))),
        ) as Record<string, unknown>;
        const p = typeof parsed.p === "string" ? parsed.p : "";
        const s = typeof parsed.s === "string" ? parsed.s : "";
        const f = typeof parsed.f === "string" ? parsed.f : "";

        if (p) setPattern(p); // eslint-disable-line react-hooks/set-state-in-effect
        if (s) setTestInput(s);
        if (f) {
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

  const updateUrl = (p: string, f: string, s: string): void => {
    const newUrl = buildUrl(p, f, s);

    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handlePatternChange = (value: string): void => {
    setPattern(value);
    updateUrl(value, flagStr, testInput);
  };

  const handleFlagToggle = (flag: Flag): void => {
    const newFlags = { ...flags, [flag]: !flags[flag] };

    setFlags(newFlags);
    const newFlagStr = FLAGS.filter((f) => newFlags[f]).join("");

    updateUrl(pattern, newFlagStr, testInput);
  };

  const handleTestInputChange = (value: string): void => {
    setTestInput(value);
    updateUrl(pattern, flagStr, value);
  };

  const handleReset = (): void => {
    setPattern("");
    setFlags({ g: true, i: false, m: false, s: false, u: false });
    setTestInput("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const results = computeResults(pattern, flagStr, testInput);
  const status = getPatternStatus(pattern, flagStr, results);
  const lineCount = testInput.split("\n").length;

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Regex Tester"
        metaDescription="Test regular expressions with live match highlighting and shareable permalinks. Free online regex tester — no installation required. No data sent to servers."
        path="/regex"
        h1="Regex Tester"
        tagline="Test regular expressions against strings with live match results"
      >
        <ReferenceLinks
          refs={[{ name: "Regex Syntax", slug: "regex-syntax" }]}
        />

      {/* Pattern panel */}
      <Panel>
        <PanelHeader label="Pattern">
          {status.type && (
            <span className={styles[status.type]}>{status.label}</span>
          )}
        </PanelHeader>
        <div className={styles.patternInputRow}>
          <span className={styles.regexSlash}>/</span>
          <input
            type="text"
            className={styles.patternInput}
            value={pattern}
            onChange={(e) => {
              handlePatternChange(e.target.value);
            }}
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
                onClick={() => {
                  handleFlagToggle(flag);
                }}
                title={flagTitle(flag)}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* Test strings + Results */}
      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="Test Strings">
            <Badge>
              {lineCount} line{lineCount !== 1 ? "s" : ""}
            </Badge>
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={testInput}
              onChange={(e) => {
                handleTestInputChange(e.target.value);
              }}
              placeholder={"Enter test strings, one per line..."}
              spellCheck={false}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader label="Results" />
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
        </Panel>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
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
