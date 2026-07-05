import { useDeferredValue, useEffect, useMemo, useState } from "react";
import styles from "@/styles/json-diff.module.css";
import { Badge, Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { jsonDiff, DIFF_LABELS, formatValue, type DiffType, type DiffEntry } from "@/lib/json-diff";
import { useUrlSync } from "@/lib/useUrlSync";

export default function JsonDiffPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [leftError, setLeftError] = useState("");
  const [rightError, setRightError] = useState("");
  const [url, setUrl] = useState("");

  // Defer the diff inputs so typing stays responsive on large documents: the
  // keystroke renders immediately and the parse+diff runs at deferred priority.
  const deferredLeft = useDeferredValue(left);
  const deferredRight = useDeferredValue(right);

  const { diff, canDiff } = useMemo(() => {
    let leftParsed: unknown;
    let rightParsed: unknown;
    let leftOk = false;
    let rightOk = false;

    if (deferredLeft) {
      try {
        leftParsed = JSON.parse(deferredLeft);
        leftOk = true;
      } catch {
        leftOk = false;
      }
    }

    if (deferredRight) {
      try {
        rightParsed = JSON.parse(deferredRight);
        rightOk = true;
      } catch {
        rightOk = false;
      }
    }

    const ok =
      (deferredLeft.length > 0 || deferredRight.length > 0) && leftOk && rightOk;

    return {
      diff: ok ? jsonDiff(leftParsed, rightParsed) : ([] as DiffEntry[]),
      canDiff: ok,
    };
  }, [deferredLeft, deferredRight]);

  const counts = useMemo(() => {
    const acc = { added: 0, removed: 0, changed: 0 };

    for (const d of diff) {
      if (d.type === "added") acc.added++;
      else if (d.type === "removed") acc.removed++;
      else if (d.type === "changed" || d.type === "type-changed") acc.changed++;
    }

    return acc;
  }, [diff]);

  const buildUrl = (l: string, r: string): string => {
    if (!l && !r) return `${window.location.origin}${window.location.pathname}`;
    const encoded = btoa(
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      unescape(encodeURIComponent(JSON.stringify({ l, r }))),
    );

    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");

    if (v) {
      try {
        const payload = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          decodeURIComponent(escape(atob(v))),
        ) as Record<string, unknown>;

        if (typeof payload.l === "string") setLeft(payload.l); // eslint-disable-line react-hooks/set-state-in-effect
        if (typeof payload.r === "string") setRight(payload.r);
      } catch {
        // ignore
      }
    }

    setUrl(window.location.href);
  }, []);

  const syncUrl = (l: string, r: string): void => {
    const newUrl = buildUrl(l, r);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleLeft = (v: string): void => {
    setLeft(v);
    if (v) {
      try {
        JSON.parse(v);
        setLeftError("");
      } catch {
        setLeftError("Invalid JSON");
      }
    } else {
      setLeftError("");
    }

    syncUrl(v, right);
  };

  const handleRight = (v: string): void => {
    setRight(v);
    if (v) {
      try {
        JSON.parse(v);
        setRightError("");
      } catch {
        setRightError("Invalid JSON");
      }
    } else {
      setRightError("");
    }

    syncUrl(left, v);
  };

  const handleReset = (): void => {
    setLeft("");
    setRight("");
    setLeftError("");
    setRightError("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="JSON Diff"
        metaDescription="Compare two JSON objects and see a structured diff of added, removed, and changed keys. Free online JSON diff tool — no installation required. No data sent to servers."
        path="/json-diff"
        h1="JSON Diff"
        tagline="Compare two JSON structures and highlight structural differences"
      >

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
              onChange={(e) => {
                handleLeft(e.target.value);
              }}
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
              onChange={(e) => {
                handleRight(e.target.value);
              }}
              placeholder={
                '{\n  "name": "Alice",\n  "age": 31,\n  "city": "NYC"\n}'
              }
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.diffPanel}>
          <div className={styles.diffHeader}>
            <span className={styles.diffTitle}>Differences</span>
            {canDiff && !leftError && !rightError && (
              <div className={styles.diffSummary}>
                {counts.added > 0 && (
                  <Badge className={styles.badgeAdded}>
                    +{counts.added} added
                  </Badge>
                )}
                {counts.removed > 0 && (
                  <Badge className={styles.badgeRemoved}>
                    -{counts.removed} removed
                  </Badge>
                )}
                {counts.changed > 0 && (
                  <Badge className={styles.badgeChanged}>
                    ~{counts.changed} changed
                  </Badge>
                )}
                {diff.length === 0 && (
                  <Badge className={styles.badgeEqual}>
                    identical
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className={styles.diffList}>
            {!left && !right && (
              <span className={styles.emptyHint}>
                Paste JSON into both panels to compare
              </span>
            )}
            {(leftError || rightError) && (
              <span className={styles.emptyHint}>
                Fix JSON errors to compare
              </span>
            )}
            {canDiff && diff.length === 0 && (
              <span className={styles.emptyHint}>
                No differences found — the two JSON values are identical
              </span>
            )}
            {!leftError && !rightError && diff.map((entry, i) => (
              <div
                key={i}
                className={`${styles.diffEntry} ${styles[entry.type]}`}
              >
                <span className={styles.diffBadge}>
                  {DIFF_LABELS[entry.type]}
                </span>
                <span className={styles.diffPath}>{entry.path}</span>
                <div className={styles.diffValues}>
                  {entry.oldValue !== undefined && (
                    <span className={styles.diffOld}>
                      {formatValue(entry.oldValue)}
                    </span>
                  )}
                  {entry.oldValue !== undefined &&
                    entry.newValue !== undefined && (
                      <span className={styles.arrow}>→</span>
                    )}
                  {entry.newValue !== undefined && (
                    <span className={styles.diffNew}>
                      {formatValue(entry.newValue)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
