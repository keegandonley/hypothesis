import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import styles from "@/styles/case.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { CopyButton, PermalinkRow } from "@/components/ui";

function splitWords(input: string): string[] {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function toCamel(words: string[]): string {
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("");
}

function toPascal(words: string[]): string {
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toSnake(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("_");
}

function toKebab(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("-");
}

function toScreaming(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join("_");
}

function toTitle(words: string[]): string {
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function toLower(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join(" ");
}

function toUpper(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join(" ");
}

function toDot(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join(".");
}

const CASES: { label: string; fn: (w: string[]) => string }[] = [
  { label: "camelCase", fn: toCamel },
  { label: "PascalCase", fn: toPascal },
  { label: "snake_case", fn: toSnake },
  { label: "kebab-case", fn: toKebab },
  { label: "SCREAMING_SNAKE", fn: toScreaming },
  { label: "Title Case", fn: toTitle },
  { label: "lowercase", fn: toLower },
  { label: "UPPERCASE", fn: toUpper },
  { label: "dot.case", fn: toDot },
];

export default function CasePage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("input");

    if (v) setInput(v); // eslint-disable-line react-hooks/set-state-in-effect
    setUrl(window.location.href);
  }, []);

  function handleInput(value: string): void {
    setInput(value);
    const params = new URLSearchParams();

    if (value) params.set("input", value);
    const qs = params.toString();

    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    setUrl(window.location.href);
  }

  const words = splitWords(input);
  const hasInput = words.length > 0;

  return (
    <div className={styles.page}>
      <ToolHead
        title="String Case Converter"
        description="Convert text between camelCase, snake_case, PascalCase, kebab-case, CONSTANT_CASE, and more. Free online string case converter — no installation required."
        path="/case"
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
          <Link
            href="/docs/case"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>String Case</h1>
        <p className={styles.tagline}>
          Convert between camelCase, snake_case, kebab-case, and more.
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputWrap}>
        <div className={styles.inputHeader}>
          <span className={styles.panelLabel}>Input</span>
        </div>
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
      </div>

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
    </div>
  );
}
