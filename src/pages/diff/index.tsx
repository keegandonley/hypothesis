import React, { useEffect, useState } from "react";
import styles from "@/styles/diff.module.css";
import { diffLines, diffWords, diffChars } from "diff";
import { Button, PageLayout, PermalinkRow } from "@/components/ui";

type Mode = "lines" | "words" | "chars";

const MODES: { value: Mode; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "words", label: "Words" },
  { value: "chars", label: "Chars" },
];

function computeDiff(
  original: string,
  modified: string,
  mode: Mode,
): ReturnType<typeof diffLines> {
  if (mode === "lines") return diffLines(original, modified);
  if (mode === "words") return diffWords(original, modified);

  return diffChars(original, modified);
}

export default function DiffPage(): React.ReactNode {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [mode, setMode] = useState<Mode>("lines");
  const [url, setUrl] = useState("");

  const changes = computeDiff(original, modified, mode);

  const added = changes
    .filter((c) => c.added)
    .reduce((n, c) => {
      if (mode === "lines")
        return n + c.value.split("\n").filter((l) => l.length > 0).length;

      return n + 1;
    }, 0);
  const removed = changes
    .filter((c) => c.removed)
    .reduce((n, c) => {
      if (mode === "lines")
        return n + c.value.split("\n").filter((l) => l.length > 0).length;

      return n + 1;
    }, 0);

  const buildUrl = (a: string, b: string, m: Mode): string => {
    if (!a && !b) return `${window.location.origin}${window.location.pathname}`;
    const payload = JSON.stringify({ a, b, m });
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const encoded = btoa(unescape(encodeURIComponent(payload)));

    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
  };

  const syncUrl = (a: string, b: string, m: Mode): void => {
    const newUrl = buildUrl(a, b, m);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("v");

    if (encoded) {
      try {
        const payload = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          decodeURIComponent(escape(atob(encoded))),
        ) as { a?: string; b?: string; m?: string };

        if (typeof payload.a === "string") setOriginal(payload.a); // eslint-disable-line react-hooks/set-state-in-effect
        if (typeof payload.b === "string") setModified(payload.b);
        if (
          payload.m === "lines" ||
          payload.m === "words" ||
          payload.m === "chars"
        )
          setMode(payload.m);
      } catch {
        // invalid, ignore
      }
    }

    setUrl(window.location.href);
  }, []);

  const handleOriginalChange = (v: string): void => {
    setOriginal(v);
    syncUrl(v, modified, mode);
  };

  const handleModifiedChange = (v: string): void => {
    setModified(v);
    syncUrl(original, v, mode);
  };

  const handleModeChange = (m: Mode): void => {
    setMode(m);
    syncUrl(original, modified, m);
  };

  const handleReset = (): void => {
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
      <PageLayout
        metaTitle="Text Diff"
        metaDescription="Compare two text blocks and see a visual diff with added and removed lines highlighted. Free online text diff tool — no installation required. No data sent to servers."
        path="/diff"
        h1="Text Diff"
        tagline="Compare two blocks of text and highlight additions and deletions"
      >

      <div className={styles.inputs}>
        <div className={styles.inputPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Original</span>
          </div>
          <textarea
            className={styles.textarea}
            value={original}
            onChange={(e) => {
              handleOriginalChange(e.target.value);
            }}
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
            onChange={(e) => {
              handleModifiedChange(e.target.value);
            }}
            placeholder="Paste modified text here…"
            spellCheck={false}
          />
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.modeGroup}>
          {MODES.map(({ value, label }) => (
            <Button
              key={value}
              variant="tab"
              active={mode === value}
              onClick={() => {
                handleModeChange(value);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        {!isEmpty && (
          <div className={styles.stats}>
            <span className={styles.statAdded}>
              +{added}{" "}
              {mode === "lines"
                ? "lines"
                : mode === "words"
                  ? "words"
                  : "chars"}
            </span>
            <span className={styles.statRemoved}>
              −{removed}{" "}
              {mode === "lines"
                ? "lines"
                : mode === "words"
                  ? "words"
                  : "chars"}
            </span>
          </div>
        )}
      </div>

      <div className={styles.output}>
        {isEmpty ? (
          <span className={styles.placeholder}>
            Paste text into both fields above to see the diff.
          </span>
        ) : changes.length === 0 ||
          changes.every((c) => !c.added && !c.removed) ? (
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

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
