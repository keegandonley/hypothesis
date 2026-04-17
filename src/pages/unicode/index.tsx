import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/unicode.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { ReferenceLinks } from "@/components/ReferenceLinks";

const MAX_CODEPOINTS = 512;

const NAMED_ENTITIES: Record<number, string> = {
  34: "&quot;",
  38: "&amp;",
  39: "&apos;",
  60: "&lt;",
  62: "&gt;",
  160: "&nbsp;",
  161: "&iexcl;",
  162: "&cent;",
  163: "&pound;",
  169: "&copy;",
  174: "&reg;",
  176: "&deg;",
  215: "&times;",
  247: "&divide;",
};

function toUtf8Hex(cp: number): string {
  return Array.from(new TextEncoder().encode(String.fromCodePoint(cp)))
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function toUtf16Hex(char: string): string {
  return Array.from({ length: char.length }, (_, i) => char.charCodeAt(i))
    .map((u) => u.toString(16).padStart(4, "0").toUpperCase())
    .join(" ");
}

function getCategory(char: string): string {
  if (/\p{Lu}/u.test(char)) return "Letter, Uppercase (Lu)";
  if (/\p{Ll}/u.test(char)) return "Letter, Lowercase (Ll)";
  if (/\p{Lt}/u.test(char)) return "Letter, Titlecase (Lt)";
  if (/\p{Lm}/u.test(char)) return "Letter, Modifier (Lm)";
  if (/\p{Lo}/u.test(char)) return "Letter, Other (Lo)";
  if (/\p{Mn}/u.test(char)) return "Mark, Nonspacing (Mn)";
  if (/\p{Mc}/u.test(char)) return "Mark, Spacing (Mc)";
  if (/\p{Me}/u.test(char)) return "Mark, Enclosing (Me)";
  if (/\p{Nd}/u.test(char)) return "Number, Decimal (Nd)";
  if (/\p{Nl}/u.test(char)) return "Number, Letter (Nl)";
  if (/\p{No}/u.test(char)) return "Number, Other (No)";
  if (/\p{Pc}/u.test(char)) return "Punctuation, Connector (Pc)";
  if (/\p{Pd}/u.test(char)) return "Punctuation, Dash (Pd)";
  if (/\p{Ps}/u.test(char)) return "Punctuation, Open (Ps)";
  if (/\p{Pe}/u.test(char)) return "Punctuation, Close (Pe)";
  if (/\p{Pi}/u.test(char)) return "Punctuation, Initial (Pi)";
  if (/\p{Pf}/u.test(char)) return "Punctuation, Final (Pf)";
  if (/\p{Po}/u.test(char)) return "Punctuation, Other (Po)";
  if (/\p{Sm}/u.test(char)) return "Symbol, Math (Sm)";
  if (/\p{Sc}/u.test(char)) return "Symbol, Currency (Sc)";
  if (/\p{Sk}/u.test(char)) return "Symbol, Modifier (Sk)";
  if (/\p{So}/u.test(char)) return "Symbol, Other (So)";
  if (/\p{Zs}/u.test(char)) return "Separator, Space (Zs)";
  if (/\p{Zl}/u.test(char)) return "Separator, Line (Zl)";
  if (/\p{Zp}/u.test(char)) return "Separator, Paragraph (Zp)";
  if (/\p{Cc}/u.test(char)) return "Other, Control (Cc)";
  if (/\p{Cf}/u.test(char)) return "Other, Format (Cf)";
  if (/\p{Cs}/u.test(char)) return "Other, Surrogate (Cs)";
  if (/\p{Co}/u.test(char)) return "Other, Private Use (Co)";
  return "Other, Unassigned (Cn)";
}

function getScript(char: string): string {
  if (/\p{Emoji}/u.test(char)) return "Emoji";
  if (/\p{Script=Latin}/u.test(char)) return "Latin";
  if (/\p{Script=Greek}/u.test(char)) return "Greek";
  if (/\p{Script=Cyrillic}/u.test(char)) return "Cyrillic";
  if (/\p{Script=Han}/u.test(char)) return "Han";
  if (/\p{Script=Hiragana}/u.test(char)) return "Hiragana";
  if (/\p{Script=Katakana}/u.test(char)) return "Katakana";
  if (/\p{Script=Arabic}/u.test(char)) return "Arabic";
  if (/\p{Script=Hebrew}/u.test(char)) return "Hebrew";
  if (/\p{Script=Devanagari}/u.test(char)) return "Devanagari";
  if (/\p{Script=Bengali}/u.test(char)) return "Bengali";
  if (/\p{Script=Thai}/u.test(char)) return "Thai";
  if (/\p{Script=Hangul}/u.test(char)) return "Hangul";
  if (/\p{Script=Georgian}/u.test(char)) return "Georgian";
  if (/\p{Script=Armenian}/u.test(char)) return "Armenian";
  if (/\p{Script=Ethiopic}/u.test(char)) return "Ethiopic";
  if (/\p{Script=Common}/u.test(char)) return "Common";
  return "Unknown";
}

function getHtmlEntity(cp: number): string {
  if (cp in NAMED_ENTITIES) return NAMED_ENTITIES[cp];
  return `&#x${cp.toString(16).toUpperCase()};`;
}

function getDisplayChar(char: string, cp: number): string {
  // Control characters and whitespace: show placeholder
  if (cp < 32 || (cp >= 127 && cp < 160)) return "␣";
  if (cp === 32) return "·";
  return char;
}

interface CharInfo {
  char: string;
  cp: number;
  codePoint: string;
  decimal: string;
  utf8: string;
  utf16: string;
  category: string;
  script: string;
  htmlEntity: string;
  display: string;
}

function analyzeText(text: string): { chars: CharInfo[]; truncated: boolean } {
  const codePoints = [...text];
  const truncated = codePoints.length > MAX_CODEPOINTS;
  const slice = truncated ? codePoints.slice(0, MAX_CODEPOINTS) : codePoints;

  const chars: CharInfo[] = slice.map((char) => {
    const cp = char.codePointAt(0)!;
    return {
      char,
      cp,
      codePoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      decimal: cp.toString(10),
      utf8: toUtf8Hex(cp),
      utf16: toUtf16Hex(char),
      category: getCategory(char),
      script: getScript(char),
      htmlEntity: getHtmlEntity(cp),
      display: getDisplayChar(char, cp),
    };
  });

  return { chars, truncated };
}

export default function UnicodePage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { chars, truncated } = analyzeText(text);
  const cpCount = [...text].length;

  const buildUrl = (txt: string) => {
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
        setText(decoded);
      } catch {
        // Invalid encoding, ignore
      }
    }
    setUrl(window.location.href);
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);
    const newUrl = buildUrl(value);
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
    setText("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — UNICODE INSPECTOR`}</title>
        <meta name="description" content="Inspect each character's code point, UTF-8/UTF-16 encoding, Unicode category, script, and HTML entity." />
        <meta property="og:title" content="Unicode Inspector" />
        <meta property="og:description" content="Inspect each character's code point, UTF-8/UTF-16 encoding, Unicode category, script, and HTML entity." />
        <meta property="og:url" content="https://hypothesis.sh/unicode" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Unicode Inspector" />
        <meta name="twitter:description" content="Inspect each character's code point, UTF-8/UTF-16 encoding, Unicode category, script, and HTML entity." />
        <link rel="canonical" href="https://hypothesis.sh/unicode" />
      </Head>
      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/unicode"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Unicode Inspector</h1>
        <p className={styles.tagline}>Inspect code points, UTF-8/UTF-16 bytes, category, script, and HTML entity</p>
        <ReferenceLinks refs={[{ name: "Unicode Blocks", slug: "unicode-blocks" }, { name: "ASCII Table", slug: "ascii" }]} />
      </div>

      <hr className={styles.divider} />

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <div className={styles.textareaSection}>
            <div className={styles.textareaHeader}>
              <span className={styles.sectionLabel}>Text Input</span>
              {text.length === 0 ? (
                <span className={styles.badgeReady}>Ready</span>
              ) : (
                <span className={styles.badge}>
                  {cpCount} code point{cpCount !== 1 ? "s" : ""} · {text.length} char{text.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
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
            <div className={styles.emptyState}>Enter text to inspect characters</div>
          ) : (
            <div className={styles.charList}>
              {chars.map((info, i) => (
                <div key={i} className={styles.charCard}>
                  <div className={styles.charGlyph}>{info.display}</div>
                  <div className={styles.charFields}>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>Code Point</span>
                      <span className={styles.fieldValueAccent}>{info.codePoint}</span>
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
                      <span className={styles.fieldValue}>{info.htmlEntity}</span>
                    </div>
                    <div className={styles.charField}>
                      <span className={styles.fieldLabel}>Name</span>
                      <span className={styles.fieldValue}>U+{info.cp.toString(16).toUpperCase().padStart(4, "0")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.permalinkLabel}>Permalink</span>
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
