import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import styles from "@/styles/json-yaml.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { dump, load } from "js-yaml";

export default function JsonYamlPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [json, setJson] = useState("");
  const [yaml, setYaml] = useState("");
  const [jsonError, setJsonError] = useState(false);
  const [yamlError, setYamlError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const j = params.get("json");
    const y = params.get("yaml");
    if (j) {
      const decoded = decodeURIComponent(j);
      setJson(decoded);
      try {
        const parsed = JSON.parse(decoded);
        setYaml(dump(parsed, { indent: 2 }).trimEnd());
        setJsonError(false);
      } catch {
        setJsonError(true);
      }
    } else if (y) {
      const decoded = decodeURIComponent(y);
      setYaml(decoded);
      try {
        const parsed = load(decoded);
        setJson(JSON.stringify(parsed, null, 2));
        setYamlError(false);
      } catch {
        setYamlError(true);
      }
    }
    setUrl(window.location.href);
  }, []);

  function handleJsonChange(value: string) {
    setJson(value);
    if (!value.trim()) {
      setYaml("");
      setJsonError(false);
      history.replaceState(null, "", window.location.pathname);
      setUrl(window.location.href);
      return;
    }
    try {
      const parsed = JSON.parse(value);
      const yamlOut = dump(parsed, { indent: 2 }).trimEnd();
      setYaml(yamlOut);
      setJsonError(false);
      const params = new URLSearchParams({ json: encodeURIComponent(value) });
      history.replaceState(null, "", `?${params}`);
      setUrl(window.location.href);
    } catch {
      setJsonError(true);
    }
  }

  function handleYamlChange(value: string) {
    setYaml(value);
    if (!value.trim()) {
      setJson("");
      setYamlError(false);
      history.replaceState(null, "", window.location.pathname);
      setUrl(window.location.href);
      return;
    }
    try {
      const parsed = load(value);
      const jsonOut = JSON.stringify(parsed, null, 2);
      setJson(jsonOut);
      setYamlError(false);
      const params = new URLSearchParams({ yaml: encodeURIComponent(value) });
      history.replaceState(null, "", `?${params}`);
      setUrl(window.location.href);
    } catch {
      setYamlError(true);
    }
  }

  function handleCopy() {
    copyToClipboard(url);
    setCopied(true);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.page}>
      <ToolHead
        title="JSON ↔ YAML Converter"
        description="Convert between JSON and YAML with live bidirectional sync and shareable permalinks. Free online JSON to YAML converter — no installation required."
        path="/json-yaml"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link href="/docs/json-yaml" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>JSON ↔ YAML</h1>
        <p className={styles.tagline}>
          Convert between JSON and YAML with live bidirectional sync.
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>JSON</span>
            {jsonError && (
              <span className={styles.badgeError}>invalid json</span>
            )}
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={json}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder='{"key": "value"}'
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>YAML</span>
            {yamlError && (
              <span className={styles.badgeError}>invalid yaml</span>
            )}
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={yaml}
              onChange={(e) => handleYamlChange(e.target.value)}
              placeholder="key: value"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn} ${copied ? styles.copied : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
        <button
          className={styles.resetBtn}
          onClick={() => {
            setJson("");
            setYaml("");
            setJsonError(false);
            setYamlError(false);
            history.replaceState(null, "", window.location.pathname);
            setUrl(window.location.href);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
