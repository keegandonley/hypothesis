import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/html-entity.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { ReferenceLinks } from "@/components/ReferenceLinks";

// HTML5 named entity map (comprehensive set)
const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
  "¡": "&iexcl;",
  "¢": "&cent;",
  "£": "&pound;",
  "¤": "&curren;",
  "¥": "&yen;",
  "¦": "&brvbar;",
  "§": "&sect;",
  "¨": "&uml;",
  "©": "&copy;",
  "ª": "&ordf;",
  "«": "&laquo;",
  "¬": "&not;",
  "®": "&reg;",
  "¯": "&macr;",
  "°": "&deg;",
  "±": "&plusmn;",
  "²": "&sup2;",
  "³": "&sup3;",
  "´": "&acute;",
  "µ": "&micro;",
  "¶": "&para;",
  "·": "&middot;",
  "¸": "&cedil;",
  "¹": "&sup1;",
  "º": "&ordm;",
  "»": "&raquo;",
  "¼": "&frac14;",
  "½": "&frac12;",
  "¾": "&frac34;",
  "¿": "&iquest;",
  "À": "&Agrave;",
  "Á": "&Aacute;",
  "Â": "&Acirc;",
  "Ã": "&Atilde;",
  "Ä": "&Auml;",
  "Å": "&Aring;",
  "Æ": "&AElig;",
  "Ç": "&Ccedil;",
  "È": "&Egrave;",
  "É": "&Eacute;",
  "Ê": "&Ecirc;",
  "Ë": "&Euml;",
  "Ì": "&Igrave;",
  "Í": "&Iacute;",
  "Î": "&Icirc;",
  "Ï": "&Iuml;",
  "Ð": "&ETH;",
  "Ñ": "&Ntilde;",
  "Ò": "&Ograve;",
  "Ó": "&Oacute;",
  "Ô": "&Ocirc;",
  "Õ": "&Otilde;",
  "Ö": "&Ouml;",
  "×": "&times;",
  "Ø": "&Oslash;",
  "Ù": "&Ugrave;",
  "Ú": "&Uacute;",
  "Û": "&Ucirc;",
  "Ü": "&Uuml;",
  "Ý": "&Yacute;",
  "Þ": "&THORN;",
  "ß": "&szlig;",
  "à": "&agrave;",
  "á": "&aacute;",
  "â": "&acirc;",
  "ã": "&atilde;",
  "ä": "&auml;",
  "å": "&aring;",
  "æ": "&aelig;",
  "ç": "&ccedil;",
  "è": "&egrave;",
  "é": "&eacute;",
  "ê": "&ecirc;",
  "ë": "&euml;",
  "ì": "&igrave;",
  "í": "&iacute;",
  "î": "&icirc;",
  "ï": "&iuml;",
  "ð": "&eth;",
  "ñ": "&ntilde;",
  "ò": "&ograve;",
  "ó": "&oacute;",
  "ô": "&ocirc;",
  "õ": "&otilde;",
  "ö": "&ouml;",
  "÷": "&divide;",
  "ø": "&oslash;",
  "ù": "&ugrave;",
  "ú": "&uacute;",
  "û": "&ucirc;",
  "ü": "&uuml;",
  "ý": "&yacute;",
  "þ": "&thorn;",
  "ÿ": "&yuml;",
  "€": "&euro;",
  "−": "&minus;",
  "™": "&trade;",
  "←": "&larr;",
  "↑": "&uarr;",
  "→": "&rarr;",
  "↓": "&darr;",
  "↔": "&harr;",
  "∀": "&forall;",
  "∂": "&part;",
  "∃": "&exist;",
  "∅": "&empty;",
  "∇": "&nabla;",
  "∈": "&isin;",
  "∉": "&notin;",
  "∋": "&ni;",
  "∏": "&prod;",
  "∑": "&sum;",
  "√": "&radic;",
  "∞": "&infin;",
  "∠": "&ang;",
  "∧": "&and;",
  "∨": "&or;",
  "∩": "&cap;",
  "∪": "&cup;",
  "∫": "&int;",
  "∴": "&there4;",
  "∼": "&sim;",
  "≅": "&cong;",
  "≈": "&asymp;",
  "≠": "&ne;",
  "≡": "&equiv;",
  "≤": "&le;",
  "≥": "&ge;",
  "⊂": "&sub;",
  "⊃": "&sup;",
  "⊄": "&nsub;",
  "⊆": "&sube;",
  "⊇": "&supe;",
  "⊕": "&oplus;",
  "⊗": "&otimes;",
  "⊥": "&perp;",
  "⋅": "&sdot;",
  " ": "&nbsp;",
};

// Create reverse map for decoding
const reverseEntities: Record<string, string> = {};
for (const [char, entity] of Object.entries(htmlEntities)) {
  reverseEntities[entity] = char;
}

type EncodeMode = "all" | "special" | "non-ascii";

function encodeHtmlEntities(text: string, mode: EncodeMode): string {
  if (!text) return "";
  
  if (mode === "special") {
    // Only encode essential HTML special characters
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  } else if (mode === "non-ascii") {
    // Encode non-ASCII characters
    return text.replace(/[^\x00-\x7F]/g, (char) => {
      return htmlEntities[char] || `&#${char.charCodeAt(0)};`;
    });
  } else {
    // Encode all available entities
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
      .replace(/[^\x00-\x7F]/g, (char) => {
        return htmlEntities[char] || `&#${char.charCodeAt(0)};`;
      });
  }
}

function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  
  return text
    // Decode named entities
    .replace(/&[a-zA-Z]+;/g, (entity) => reverseEntities[entity] || entity)
    // Decode numeric entities (decimal)
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    // Decode numeric entities (hex)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export default function HtmlEntityPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [decoded, setDecoded] = useState("");
  const [encoded, setEncoded] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [encodeMode, setEncodeMode] = useState<EncodeMode>("special");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (dec: string, mode: EncodeMode) => {
    if (!dec) return `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({ value: dec });
    if (mode !== "special") params.set("mode", mode);
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    const modeParam = params.get("mode") as EncodeMode;

    if (value) {
      setDecoded(value);
      const mode = modeParam && ["all", "special", "non-ascii"].includes(modeParam) ? modeParam : "special";
      setEncodeMode(mode);
      const enc = encodeHtmlEntities(value, mode);
      setEncoded(enc);
    }
    setUrl(window.location.href);
  }, []);

  const handleDecodedChange = (value: string) => {
    setDecoded(value);
    const enc = encodeHtmlEntities(value, encodeMode);
    setEncoded(enc);
    const newUrl = buildUrl(value, encodeMode);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleEncodedChange = (value: string) => {
    setEncoded(value);
    const dec = decodeHtmlEntities(value);
    setDecoded(dec);
    const newUrl = buildUrl(dec, encodeMode);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleModeChange = (mode: EncodeMode) => {
    setEncodeMode(mode);
    const enc = encodeHtmlEntities(decoded, mode);
    setEncoded(enc);
    const newUrl = buildUrl(decoded, mode);
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleReset = () => {
    setDecoded("");
    setEncoded("");
    setEncodeMode("special");
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="HTML Entity Encoder / Decoder"
        description="Encode and decode HTML entities like &amp;, &lt;, &gt;, and named or numeric references. Free online HTML entity tool — no installation required."
        path="/html-entity"
        brandName={branding.name}
      />
      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/html-entity"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>HTML Entity</h1>
        <p className={styles.tagline}>Encode and decode HTML entities</p>
        <ReferenceLinks refs={[{ name: "ASCII Table", slug: "ascii" }]} />
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Decoded Text</span>
            <span className={styles.badge}>{decoded.length} chars</span>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={decoded}
              onChange={(e) => handleDecodedChange(e.target.value)}
              placeholder="Type or paste text here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>HTML Entities</span>
            <span className={styles.badge}>{encoded.length} chars</span>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={encoded}
              onChange={(e) => handleEncodedChange(e.target.value)}
              placeholder="Paste encoded entities here..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div className={styles.modeSelector}>
        <span className={styles.fieldLabel}>Encode Mode</span>
        <div className={styles.modeButtons}>
          <button
            className={`${styles.modeBtn} ${encodeMode === "special" ? styles.active : ""}`}
            onClick={() => handleModeChange("special")}
          >
            Special (&lt; &gt; &amp; &quot; &apos;)
          </button>
          <button
            className={`${styles.modeBtn} ${encodeMode === "non-ascii" ? styles.active : ""}`}
            onClick={() => handleModeChange("non-ascii")}
          >
            Non-ASCII Only (excludes special chars)
          </button>
          <button
            className={`${styles.modeBtn} ${encodeMode === "all" ? styles.active : ""}`}
            onClick={() => handleModeChange("all")}
          >
            Special + Non-ASCII
          </button>
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
