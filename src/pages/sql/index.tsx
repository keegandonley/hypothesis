import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/sql.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { format, type SqlLanguage } from "sql-formatter";

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "bigquery", label: "BigQuery" },
];

const PLACEHOLDER = `SELECT u.id, u.name, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.created_at > '2024-01-01' GROUP BY u.id, u.name HAVING COUNT(o.id) > 0 ORDER BY order_count DESC LIMIT 25;`;

export default function SqlPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [dialect, setDialect] = useState<SqlLanguage>("sql");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sqlCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  let formatted = "";
  let error = "";
  if (input) {
    try {
      formatted = format(input, { language: dialect, tabWidth: 2, keywordCase: "upper" });
    } catch (e) {
      error = e instanceof Error ? e.message : "Formatting error";
    }
  }

  const buildUrl = (text: string, d: SqlLanguage) => {
    const params = new URLSearchParams({ d });
    if (text) params.set("v", btoa(unescape(encodeURIComponent(text))));
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    const d = params.get("d") as SqlLanguage | null;
    if (v) {
      try { setInput(decodeURIComponent(escape(atob(v)))); } catch { /* ignore */ }
    }
    if (d && DIALECTS.some((x) => x.value === d)) setDialect(d);
    setUrl(window.location.href);
  }, []);

  const handleChange = (text: string) => {
    setInput(text);
    const newUrl = buildUrl(text, dialect);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleDialect = (d: SqlLanguage) => {
    setDialect(d);
    const newUrl = buildUrl(input, d);
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

  const handleReset = () => {
    setInput("");
    setDialect("sql");
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopySql = () => {
    copyToClipboard(formatted).then(() => {
      setCopiedSql(true);
      if (sqlCopyTimeoutRef.current) clearTimeout(sqlCopyTimeoutRef.current);
      sqlCopyTimeoutRef.current = setTimeout(() => setCopiedSql(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="SQL Formatter"
        description="Format and prettify SQL queries with proper indentation. Supports PostgreSQL, MySQL, SQLite, BigQuery. Free online SQL formatter — no signup needed."
        path="/sql"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link href="/docs/sql" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>SQL Formatter</h1>
        <p className={styles.tagline}>Format and prettify SQL queries with dialect-aware keyword casing</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Input</span>
          </div>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Formatted</span>
            <div className={styles.panelHeaderRight}>
              {DIALECTS.map((d) => (
                <button
                  key={d.value}
                  className={`${styles.toggleBtn}${dialect === d.value ? ` ${styles.active}` : ""}`}
                  onClick={() => handleDialect(d.value)}
                >
                  {d.label}
                </button>
              ))}
              {!isIframe && (
                <button
                  className={`${styles.panelCopyBtn}${copiedSql ? ` ${styles.panelCopied}` : ""}`}
                  onClick={handleCopySql}
                  disabled={!formatted}
                >
                  {copiedSql ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>
          {error ? (
            <div className={styles.errorMsg}>{error}</div>
          ) : (
            <textarea
              className={`${styles.textarea} ${styles.output}`}
              value={formatted}
              readOnly
              spellCheck={false}
              placeholder="Formatted SQL will appear here…"
            />
          )}
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
