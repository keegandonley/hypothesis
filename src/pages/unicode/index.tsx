import { useEffect, useState } from "react";
import styles from "@/styles/unicode.module.css";
import { Badge, Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { MAX_CODEPOINTS, analyzeText } from "@/lib/unicode";

export default function UnicodePage(): React.ReactNode {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  const { chars, truncated } = analyzeText(text);
  // eslint-disable-next-line @typescript-eslint/no-misused-spread
  const cpCount = [...text].length;

  const buildUrl = (txt: string): string => {
    if (!txt) return `${window.location.origin}${window.location.pathname}`;
    const encoded = btoa(encodeURIComponent(txt));

    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("v");

    if (encoded) {
      try {
        const decoded = decodeURIComponent(atob(encoded));

        setText(decoded); // eslint-disable-line react-hooks/set-state-in-effect
      } catch {
        // Invalid encoding, ignore
      }
    }

    setUrl(window.location.href);
  }, []);

  const handleTextChange = (value: string): void => {
    setText(value);
    const newUrl = buildUrl(value);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setText("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Unicode Inspector"
        metaDescription="Inspect Unicode code points, names, categories, and UTF-8 encodings for any character or string. Free online Unicode inspector — no installation required."
        path="/unicode"
        h1="Unicode Inspector"
        tagline="Inspect code points, UTF-8/UTF-16 bytes, category, script, and HTML entity"
        refs={[
          { name: "Unicode Blocks", slug: "unicode-blocks" },
          { name: "ASCII Table", slug: "ascii" },
        ]}
      >

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <div className={styles.textareaSection}>
            <div className={styles.textareaHeader}>
              <span className={styles.sectionLabel}>Text Input</span>
              {text.length === 0 ? (
                <Badge color="ready">Ready</Badge>
              ) : (
                <Badge>
                  {cpCount} code point{cpCount !== 1 ? "s" : ""} · {text.length}{" "}
                  char{text.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => {
                handleTextChange(e.target.value);
              }}
              placeholder="Type or paste text to inspect..."
              spellCheck={false}
            />
            {truncated && (
              <div className={styles.truncatedNotice}>
                Showing first {MAX_CODEPOINTS} code points of {cpCount} total
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightPanel}>
          {chars.length === 0 ? (
            <div className={styles.emptyState}>
              Enter text to inspect characters
            </div>
          ) : (
            <div className={styles.charList}>
              {chars.map((info, i) => (
                <div key={i} className={styles.charCard}>
                  <div className={styles.charGlyph}>{info.display}</div>
                  <div className={styles.charFields}>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>Code Point</span>
                      <span className={styles.fieldValueAccent}>
                        {info.codePoint}
                      </span>
                    </div>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>Decimal</span>
                      <span className={styles.fieldValue}>{info.decimal}</span>
                    </div>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>UTF-8</span>
                      <span className={styles.fieldValue}>{info.utf8}</span>
                    </div>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>UTF-16</span>
                      <span className={styles.fieldValue}>{info.utf16}</span>
                    </div>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>Category</span>
                      <span className={styles.fieldValue}>{info.category}</span>
                    </div>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>Script</span>
                      <span className={styles.fieldValue}>{info.script}</span>
                    </div>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>HTML Entity</span>
                      <span className={styles.fieldValue}>
                        {info.htmlEntity}
                      </span>
                    </div>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>Name</span>
                      <span className={styles.fieldValue}>
                        U+{info.cp.toString(16).toUpperCase().padStart(4, "0")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
