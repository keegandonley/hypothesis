import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import styles from "../../styles/cron.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";
import { ReferenceLinks } from "@/components/ReferenceLinks";

const EXAMPLES = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Every hour", expr: "0 * * * *" },
  { label: "Daily at midnight", expr: "0 0 * * *" },
  { label: "Weekdays at 9 AM", expr: "0 9 * * 1-5" },
  { label: "Weekly on Sunday", expr: "0 0 * * 0" },
  { label: "Monthly 1st", expr: "0 0 1 * *" },
];

const NEXT_COUNT = 10;

interface ParseResult {
  description: string;
  nextRuns: Date[];
  error: null;
}

interface ParseError {
  error: string;
}

function parseCron(expr: string): ParseResult | ParseError {
  const trimmed = expr.trim();
  if (!trimmed) return { error: "empty" };

  let description: string;
  try {
    description = cronstrue.toString(trimmed, { throwExceptionOnParseError: true });
  } catch {
    return { error: "Invalid cron expression" };
  }

  try {
    const interval = CronExpressionParser.parse(trimmed);
    const nextRuns: Date[] = [];
    for (let i = 0; i < NEXT_COUNT; i++) {
      nextRuns.push(interval.next().toDate());
    }
    return { description, nextRuns, error: null };
  } catch {
    return { error: "Invalid cron expression" };
  }
}

function formatLocal(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatUtc(d: Date): string {
  return d.toUTCString();
}

export default function CronPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyDescTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (expr: string) => {
    if (!expr) return `${window.location.origin}${window.location.pathname}`;
    return `${window.location.origin}${window.location.pathname}?expr=${encodeURIComponent(expr)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const expr = params.get("expr");
    if (expr) {
      setInput(expr);
      const r = parseCron(expr);
      if (r.error === null) {
        setResult(r as ParseResult);
      } else if (r.error !== "empty") {
        setErrorMsg(r.error);
      }
    }
    setUrl(window.location.href);
  }, []);

  const handleChange = (raw: string) => {
    setInput(raw);
    const trimmed = raw.trim();
    if (!trimmed) {
      setResult(null);
      setErrorMsg(null);
      const newUrl = buildUrl("");
      history.replaceState(null, "", newUrl);
      setUrl(newUrl);
      return;
    }
    const r = parseCron(trimmed);
    if (r.error === null) {
      setResult(r as ParseResult);
      setErrorMsg(null);
      const newUrl = buildUrl(trimmed);
      history.replaceState(null, "", newUrl);
      setUrl(newUrl);
    } else if (r.error !== "empty") {
      setResult(null);
      setErrorMsg(r.error);
    }
  };

  const handleExample = (expr: string) => {
    setInput(expr);
    handleChange(expr);
  };

  const handleReset = () => {
    setInput("");
    setResult(null);
    setErrorMsg(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleCopyDesc = () => {
    if (!result) return;
    copyToClipboard(result.description).then(() => {
      setCopiedDesc(true);
      if (copyDescTimeoutRef.current) clearTimeout(copyDescTimeoutRef.current);
      copyDescTimeoutRef.current = setTimeout(() => setCopiedDesc(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="Cron Expression Parser"
        description="Parse and explain cron expressions with a human-readable schedule preview. Free online cron parser — no installation required. No data sent to servers."
        path="/cron"
        brandName={branding.name}
      />

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
          <Link href="/docs/cron" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Cron</h1>
        <p className={styles.tagline}>Parse cron expressions and preview the next scheduled run times</p>
        <ReferenceLinks refs={[{ name: "Exit Codes", slug: "exit-codes" }, { name: "Unix Signals", slug: "unix-signals" }]} />
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputRow}>
        <input
          className={`${styles.input}${errorMsg ? ` ${styles.inputError}` : ""}`}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g. 0 9 * * 1-5"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {errorMsg && <span className={styles.badgeError}>invalid</span>}
      </div>

      <div className={styles.examplesRow}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.expr}
            className={`${styles.exampleBtn}${input === ex.expr ? ` ${styles.exampleActive}` : ""}`}
            onClick={() => handleExample(ex.expr)}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {result && (
        <>
          <div className={styles.descPanel}>
            <div className={styles.descHeader}>
              <span className={styles.panelLabel}>Description</span>
              {!isIframe && (
                <button
                  className={`${styles.copyFieldBtn}${copiedDesc ? ` ${styles.copied}` : ""}`}
                  onClick={handleCopyDesc}
                >
                  {copiedDesc ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className={styles.descValue}>{result.description}</div>
          </div>

          <div className={styles.runsPanel}>
            <div className={styles.runsHeader}>
              <span className={styles.panelLabel}>Next {NEXT_COUNT} runs</span>
            </div>
            <div className={styles.runsList}>
              {result.nextRuns.map((d, i) => (
                <div key={i} className={styles.runRow}>
                  <span className={styles.runIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.runLocal}>{formatLocal(d)}</span>
                  <span className={styles.runUtc}>{formatUtc(d)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
