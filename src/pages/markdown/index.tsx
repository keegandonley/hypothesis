import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/markdown.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { marked } from "marked";

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

export default function MarkdownPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const htmlCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const html = marked.parse(input || "") as string;

  const buildUrl = (text: string) => {
    if (!text) return `${window.location.origin}${window.location.pathname}`;
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    if (v) {
      try {
        setInput(decodeURIComponent(escape(atob(v))));
      } catch {
        // ignore invalid
      }
    }
    setUrl(window.location.href);
  }, []);

  const handleChange = (text: string) => {
    setInput(text);
    const newUrl = buildUrl(text);
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
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopyHtml = () => {
    copyToClipboard(html).then(() => {
      setCopiedHtml(true);
      if (htmlCopyTimeoutRef.current) clearTimeout(htmlCopyTimeoutRef.current);
      htmlCopyTimeoutRef.current = setTimeout(() => setCopiedHtml(false), 1500);
    });
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
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Markdown</span>
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
            <span className={styles.panelLabel}>Output</span>
            <div className={styles.panelHeaderRight}>
              {(["preview", "html"] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  className={`${styles.toggleBtn}${viewMode === m ? ` ${styles.active}` : ""}`}
                  onClick={() => setViewMode(m)}
                >
                  {m}
                </button>
              ))}
              {!isIframe && (
                <button
                  className={`${styles.panelCopyBtn}${copiedHtml ? ` ${styles.panelCopied}` : ""}`}
                  onClick={handleCopyHtml}
                >
                  {copiedHtml ? "Copied!" : "Copy HTML"}
                </button>
              )}
            </div>
          </div>
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
