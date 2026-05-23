import { useEffect, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "@/styles/pretty-print.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { Button, CopyButton } from "@/components/ui";

const URL_LIMIT = 2000;

export default function PrettyPrintPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);
  const [url, setUrl] = useState("");
  const [urlTooLong, setUrlTooLong] = useState(false);

  const buildUrl = (encoded: string): string => {
    if (!encoded) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
  };

  const formatJson = (
    value: string,
  ): { output: string; valid: boolean | null } => {
    if (value.length === 0) return { output: "", valid: null };
    try {
      const parsed: unknown = JSON.parse(value);

      return { output: JSON.stringify(parsed, null, 2), valid: true };
    } catch {
      return { output: "", valid: false };
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");

    if (v) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        const decoded = decodeURIComponent(escape(atob(v)));
        const { output: fmt, valid } = formatJson(decoded);

        setInput(decoded); // eslint-disable-line react-hooks/set-state-in-effect
        setOutput(fmt);
        setJsonValid(valid);
      } catch {
        /* ignore bad param */
      }
    }

    const currentUrl = window.location.href;

    setUrl(currentUrl);
    setUrlTooLong(currentUrl.length > URL_LIMIT);
  }, []);

  const handleInputChange = (value: string): void => {
    setInput(value);
    const { output: fmt, valid } = formatJson(value);

    setOutput(fmt);
    setJsonValid(valid);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const encoded = value ? btoa(unescape(encodeURIComponent(value))) : "";
    const newUrl = buildUrl(encoded);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
    setUrlTooLong(newUrl.length > URL_LIMIT);
  };

  const handleReset = (): void => {
    setInput("");
    setOutput("");
    setJsonValid(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
    setUrlTooLong(false);
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="JSON Pretty Printer"
        description="Format and pretty-print JSON with proper indentation and syntax highlighting. Free online JSON formatter — no installation required. No data sent to servers."
        path="/pretty-print"
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
            href="/docs/pretty-print"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Pretty Print</h1>
        <p className={styles.tagline}>Format and validate JSON</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Input</span>
            <div className={styles.panelHeaderRight}>
              <span className={styles.badge}>{input.length} chars</span>
              {jsonValid === true && (
                <span className={styles.badge}>valid</span>
              )}
              {jsonValid === false && (
                <span className={styles.badgeError}>invalid</span>
              )}
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => {
                handleInputChange(e.target.value);
              }}
              placeholder="Paste JSON here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Formatted</span>
            <span className={styles.badge}>{output.length} chars</span>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={output}
              readOnly
              placeholder="Formatted output appears here..."
              spellCheck={false}
            />
            {output.length > 0 && <CopyButton value={output} variant="ghost" size="sm" className={styles.formatBtnCopy} />}
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span
          className={`${styles.permalinkUrl}${urlTooLong ? ` ${styles.permalinkDisabled}` : ""}`}
        >
          {urlTooLong ? "url too long to share" : url}
        </span>
        <CopyButton value={url} disabled={urlTooLong} />
        <Button variant="reset" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
