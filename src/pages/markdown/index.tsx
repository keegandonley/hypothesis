import { useEffect, useRef, useState } from "react";
import styles from "@/styles/markdown.module.css";
import { marked } from "marked";
import { Button, CopyButton, PageLayout, PermalinkRow, Panel, PanelHeader } from "@/components/ui";

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
      <PageLayout
        metaTitle="Markdown to HTML"
        metaDescription="Preview Markdown as rendered HTML with live sync. Toggle between output and raw HTML source. Free online Markdown previewer — no installation required."
        path="/markdown"
        h1="Markdown"
        tagline="Convert Markdown to HTML with a live preview"
      >

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
            <CopyButton value={html} variant="ghost" />
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

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
