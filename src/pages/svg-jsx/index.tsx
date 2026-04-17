import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/svg-jsx.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="8" x2="12" y2="12" />
  <line x1="12" y1="16" x2="12.01" y2="16" />
</svg>`;

function toJsx(svg: string): string {
  let result = svg;

  result = result.replace(/<\?xml[^>]*\?>/g, "");
  result = result.replace(/<!DOCTYPE[^>]*>/gi, "");
  result = result.trim();

  result = result.replace(/\s+xmlns(?::[a-z]+)?="[^"]*"/g, "");

  const attrMap: Record<string, string> = {
    "class": "className",
    "for": "htmlFor",
    "tabindex": "tabIndex",
    "readonly": "readOnly",
    "crossorigin": "crossOrigin",
    "autocomplete": "autoComplete",
    "autofocus": "autoFocus",
    "autoplay": "autoPlay",
    "srcset": "srcSet",
    "clip-path": "clipPath",
    "clip-rule": "clipRule",
    "fill-opacity": "fillOpacity",
    "fill-rule": "fillRule",
    "font-family": "fontFamily",
    "font-size": "fontSize",
    "font-style": "fontStyle",
    "font-weight": "fontWeight",
    "marker-end": "markerEnd",
    "marker-mid": "markerMid",
    "marker-start": "markerStart",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-opacity": "strokeOpacity",
    "stroke-width": "strokeWidth",
    "text-anchor": "textAnchor",
    "xlink:href": "href",
    "xml:space": "xmlSpace",
  };

  for (const [html, jsx] of Object.entries(attrMap)) {
    const re = new RegExp(`\\b${html.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=`, "g");
    result = result.replace(re, `${jsx}=`);
  }

  result = result.replace(/style="([^"]*)"/g, (_match, styleStr: string) => {
    const props = styleStr
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((decl) => {
        const [prop, ...rest] = decl.split(":");
        const value = rest.join(":").trim();
        const camel = prop.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        const jsValue = /^\d/.test(value) && !value.includes("%") && !value.includes("px") && !value.includes("em")
          ? value
          : `"${value}"`;
        return `${camel}: ${jsValue}`;
      })
      .join(", ");
    return `style={{ ${props} }}`;
  });

  result = result.replace(/<(circle|ellipse|line|path|polygon|polyline|rect|stop|use|image|animateTransform|animate|set|mpath|tref|feBlend|feColorMatrix|feComposite|feConvolveMatrix|feDiffuseLighting|feDisplacementMap|feDistantLight|feFlood|feFuncA|feFuncB|feFuncG|feFuncR|feGaussianBlur|feImage|feMergeNode|feMorphology|feOffset|fePointLight|feSpecularLighting|feSpotLight|feTile|feTurbulence)(\s[^>]*)?>(?!<\/)/g,
    (_, tag, attrs = "") => `<${tag}${attrs} />`
  );

  const componentBody = result
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");

  return `export default function Icon(props) {\n  return (\n${componentBody}\n  );\n}`;
}

export default function SvgJsxPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedJsx, setCopiedJsx] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jsxCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jsx = input ? toJsx(input) : "";

  const buildUrl = (text: string) => {
    if (!text) return `${window.location.origin}${window.location.pathname}`;
    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(btoa(unescape(encodeURIComponent(text))))}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    if (v) {
      try { setInput(decodeURIComponent(escape(atob(v)))); } catch { /* ignore */ }
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

  const handleCopyJsx = () => {
    copyToClipboard(jsx).then(() => {
      setCopiedJsx(true);
      if (jsxCopyTimeoutRef.current) clearTimeout(jsxCopyTimeoutRef.current);
      jsxCopyTimeoutRef.current = setTimeout(() => setCopiedJsx(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — SVG to JSX`}</title>
        <meta name="description" content="Convert SVG markup to React JSX — removes xmlns, converts hyphenated attributes to camelCase, and wraps inline styles as objects." />
        <meta property="og:title" content="SVG to JSX" />
        <meta property="og:description" content="Convert SVG markup to React-ready JSX." />
        <meta property="og:url" content="https://hypothesis.sh/svg-jsx" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="SVG to JSX" />
        <meta name="twitter:description" content="Convert SVG markup to React-ready JSX." />
        <link rel="canonical" href="https://hypothesis.sh/svg-jsx" />
      </Head>

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link href="/docs/svg-jsx" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>SVG to JSX</h1>
        <p className={styles.tagline}>Convert SVG markup to React-ready JSX</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>SVG</span>
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
            <span className={styles.panelLabel}>JSX</span>
            {!isIframe && (
              <button
                className={`${styles.panelCopyBtn}${copiedJsx ? ` ${styles.panelCopied}` : ""}`}
                onClick={handleCopyJsx}
                disabled={!jsx}
              >
                {copiedJsx ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <textarea
            className={`${styles.textarea} ${styles.output}`}
            value={jsx}
            readOnly
            spellCheck={false}
            placeholder="JSX output will appear here…"
          />
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
