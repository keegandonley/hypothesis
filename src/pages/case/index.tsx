import React, { useState, useEffect } from "react";
import styles from "@/styles/case.module.css";
import { CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { splitWords, CASES } from "@/lib/case";
import { useUrlSync } from "@/lib/useUrlSync";

export default function CasePage(): React.ReactNode {
  const { replaceUrl } = useUrlSync();
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("input");

    if (v) setInput(v);
    setUrl(window.location.href);
  }, []);

  function handleInput(value: string): void {
    setInput(value);
    const params = new URLSearchParams();

    if (value) params.set("input", value);
    const qs = params.toString();
    const base = `${window.location.origin}${window.location.pathname}`;
    const newUrl = qs ? `${base}?${qs}` : base;

    replaceUrl(newUrl);
    setUrl(newUrl);
  }

  const words = splitWords(input);
  const hasInput = words.length > 0;

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="String Case Converter"
        metaDescription="Convert text between camelCase, snake_case, PascalCase, kebab-case, CONSTANT_CASE, and more. Free online string case converter — no installation required."
        path="/case"
        h1="String Case"
        tagline="Convert between camelCase, snake_case, kebab-case, and more."
      >

      <Panel>
        <PanelHeader label="Input" />
        <textarea
          className={styles.textarea}
          value={input}
          onChange={(e) => {
            handleInput(e.target.value);
          }}
          placeholder="Type or paste any text..."
          autoComplete="off"
          spellCheck={false}
        />
      </Panel>

      <div className={styles.results}>
        {CASES.map((c, idx) => {
          const value = hasInput ? c.fn(words) : "";

          return (
            <div key={c.label} className={styles.resultRow}>
              <span className={styles.resultLabel}>{c.label}</span>
              {value ? (
                <span className={styles.resultValue}>{value}</span>
              ) : (
                <span className={styles.resultValueEmpty}>—</span>
              )}
              {value && <CopyButton value={value} size="xs" />}
            </div>
          );
        })}
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={() => { handleInput(""); }} />
      </PageLayout>
    </div>
  );
}
