import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "@/styles/markdown.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { marked } from "marked";
import { Button, CopyButton, PermalinkRow, Panel, PanelHeader } from "@/components/ui";

type ViewMode = "preview" | "html";

const PLACEHOLDER = `# Hello, Markdown

Write **bold**, _italic_, or \`inline code\`.

## Lists

- Item one
- Item two
- Item three

## Code block

\`\`\`js
const greet = (name) => \`Hello, \${name}!\`;
\`\`\`

> Blockquotes work too.
`;

export default function MarkdownPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [url, setUrl] = useState("");

  const html = marked.parse(input || "") as string;

  const buildUrl = (text: string): string => {
    if (!text) return `${window.location.origin}${window.location.pathname}`;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const encoded = btoa(unescape(encodeURIComponent(text)));

    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
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
        // ignore invalid
      }
    }

    setUrl(window.location.href);
  }, []);

  const handleChange = (text: string): void => {
    setInput(text);
    const newUrl = buildUrl(text);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setInput("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="Markdown to HTML"
        description="Preview Markdown as rendered HTML with live sync. Toggle between output and raw HTML source. Free online Markdown previewer — no installation required."
        path="/markdown"
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
            href="/docs/markdown"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Markdown</h1>
        <p className={styles.tagline}>
          Convert Markdown to HTML with a live preview
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="Markdown" />
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
          <PanelHeader label="Output">
            {(["preview", "html"] as ViewMode[]).map((m) => (
              <Button
                key={m}
                variant="toggle"
                active={viewMode === m}
                onClick={() => {
                  setViewMode(m);
                }}
              >
                {m}
              </Button>
            ))}
            <CopyButton value={html} variant="ghost" size="sm" />
          </PanelHeader>
          {viewMode === "preview" ? (
            <div
              className={styles.preview}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <textarea
              className={`${styles.textarea} ${styles.htmlSource}`}
              value={html}
              readOnly
              spellCheck={false}
            />
          )}
        </Panel>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
