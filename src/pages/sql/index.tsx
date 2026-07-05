import { useEffect, useRef, useState } from "react";
import styles from "@/styles/sql.module.css";
import { format, type SqlLanguage } from "sql-formatter";
import { Button, CopyButton, PageLayout, PermalinkRow, Panel, PanelHeader } from "@/components/ui";
import { useUrlSync } from "@/lib/useUrlSync";

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: "sql", label: "SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "bigquery", label: "BigQuery" },
];

const PLACEHOLDER = `SELECT u.id, u.name, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.created_at > '2024-01-01' GROUP BY u.id, u.name HAVING COUNT(o.id) > 0 ORDER BY order_count DESC LIMIT 25;`;

export default function SqlPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [input, setInput] = useState("");
  const [dialect, setDialect] = useState<SqlLanguage>("sql");
  const [url, setUrl] = useState("");

  let formatted = "";
  let error = "";

  if (input) {
    try {
      formatted = format(input, {
        language: dialect,
        tabWidth: 2,
        keywordCase: "upper",
      });
    } catch (e) {
      error = e instanceof Error ? e.message : "Formatting error";
    }
  }

  const buildUrl = (text: string, d: SqlLanguage): string => {
    const params = new URLSearchParams({ d });

    if (text)
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      params.set("v", btoa(unescape(encodeURIComponent(text))));

    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    const d = params.get("d") as SqlLanguage | null;

    if (v) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInput(
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          decodeURIComponent(escape(atob(v))),
        );
      } catch {
        /* ignore */
      }
    }

    if (d && DIALECTS.some((x) => x.value === d)) setDialect(d);
    setUrl(window.location.href);
  }, []);

  const handleChange = (text: string): void => {
    setInput(text);
    const newUrl = buildUrl(text, dialect);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleDialect = (d: SqlLanguage): void => {
    setDialect(d);
    const newUrl = buildUrl(input, d);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setInput("");
    setDialect("sql");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="SQL Formatter"
        metaDescription="Format and prettify SQL queries with proper indentation. Supports PostgreSQL, MySQL, SQLite, BigQuery. Free online SQL formatter — no signup needed."
        path="/sql"
        h1="SQL Formatter"
        tagline="Format and prettify SQL queries with dialect-aware keyword casing"
      >

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="Input" />
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => {
              handleChange(e.target.value);
            }}
            placeholder={PLACEHOLDER}
            spellCheck={false}
          />
        </Panel>

        <Panel>
          <PanelHeader
            label="Formatted"
            className={styles.panelHeaderOverride}
          >
            {DIALECTS.map((d) => (
              <Button
                key={d.value}
                variant="toggle"
                active={dialect === d.value}
                onClick={() => {
                  handleDialect(d.value);
                }}
              >
                {d.label}
              </Button>
            ))}
            <CopyButton
              value={formatted}
              variant="ghost"
              disabled={!formatted}
            />
          </PanelHeader>
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
        </Panel>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
