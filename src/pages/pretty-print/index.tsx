import { useEffect, useState } from "react";
import styles from "@/styles/pretty-print.module.css";
import { Badge, Button, CopyButton, PageLayout, Panel, PanelHeader, PanelBody } from "@/components/ui";

const URL_LIMIT = 2000;

export default function PrettyPrintPage(): React.ReactNode {
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
      <PageLayout
        metaTitle="JSON Pretty Printer"
        metaDescription="Format and pretty-print JSON with proper indentation and syntax highlighting. Free online JSON formatter — no installation required. No data sent to servers."
        path="/pretty-print"
        h1="Pretty Print"
        tagline="Format and validate JSON"
      >

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="Input">
            <Badge>{input.length} chars</Badge>
            {jsonValid === true && (
              <Badge>valid</Badge>
            )}
            {jsonValid === false && (
              <Badge color="error">invalid</Badge>
            )}
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => {
                handleInputChange(e.target.value);
              }}
              placeholder="Paste JSON here..."
              spellCheck={false}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader label="Formatted">
            <Badge>{output.length} chars</Badge>
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={output}
              readOnly
              placeholder="Formatted output appears here..."
              spellCheck={false}
            />
            {output.length > 0 && <CopyButton value={output} variant="ghost" size="sm" className={styles.formatBtnCopy} />}
          </PanelBody>
        </Panel>
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
      </PageLayout>
    </div>
  );
}
