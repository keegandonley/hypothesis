import { useEffect, useState } from "react";
import styles from "@/styles/svg-jsx.module.css";
import { Button, CopyButton, PageLayout, PermalinkRow, Panel, PanelHeader } from "@/components/ui";
import { toJsx } from "@/lib/svg-jsx";
import { useUrlSync } from "@/lib/useUrlSync";

const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="8" x2="12" y2="12" />
  <line x1="12" y1="16" x2="12.01" y2="16" />
</svg>`;

export default function SvgJsxPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");


  const jsx = input ? toJsx(input) : "";

  const buildUrl = (text: string): string => {
    if (!text) return `${window.location.origin}${window.location.pathname}`;

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(btoa(unescape(encodeURIComponent(text))))}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");

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

    setUrl(window.location.href);
  }, []);

  const handleChange = (text: string): void => {
    setInput(text);
    const newUrl = buildUrl(text);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setInput("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="SVG to JSX"
        metaDescription="Convert SVG markup to React JSX syntax with automatic camelCase attribute conversion. Free online SVG to JSX converter — no installation required."
        path="/svg-jsx"
        h1="SVG to JSX"
        tagline="Convert SVG markup to React-ready JSX"
      >

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="SVG" />
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
          <PanelHeader label="JSX">
            <CopyButton value={jsx} variant="ghost" size="sm" disabled={!jsx} />
          </PanelHeader>
          <textarea
            className={`${styles.textarea} ${styles.output}`}
            value={jsx}
            readOnly
            spellCheck={false}
            placeholder="JSX output will appear here…"
          />
        </Panel>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
