import { useEffect, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "@/styles/svg-jsx.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { Button, CopyButton, PermalinkRow } from "@/components/ui";

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
    class: "className",
    for: "htmlFor",
    tabindex: "tabIndex",
    readonly: "readOnly",
    crossorigin: "crossOrigin",
    autocomplete: "autoComplete",
    autofocus: "autoFocus",
    autoplay: "autoPlay",
    srcset: "srcSet",
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
    const re = new RegExp(
      `\\b${html.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=`,
      "g",
    );

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
        const camel = prop
          .trim()
          .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        const jsValue =
          /^\d/.test(value) &&
          !value.includes("%") &&
          !value.includes("px") &&
          !value.includes("em")
            ? value
            : `"${value}"`;

        return `${camel}: ${jsValue}`;
      })
      .join(", ");

    return `style={{ ${props} }}`;
  });

  result = result.replace(
    /<(circle|ellipse|line|path|polygon|polyline|rect|stop|use|image|animateTransform|animate|set|mpath|tref|feBlend|feColorMatrix|feComposite|feConvolveMatrix|feDiffuseLighting|feDisplacementMap|feDistantLight|feFlood|feFuncA|feFuncB|feFuncG|feFuncR|feGaussianBlur|feImage|feMergeNode|feMorphology|feOffset|fePointLight|feSpecularLighting|feSpotLight|feTile|feTurbulence)(\s[^>]*)?>(?!<\/)/g,
    (_, tag, attrs = "") => `<${tag}${attrs} />`,
  );

  const componentBody = result
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");

  return `export default function Icon(props) {\n  return (\n${componentBody}\n  );\n}`;
}

export default function SvgJsxPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
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
        title="SVG to JSX"
        description="Convert SVG markup to React JSX syntax with automatic camelCase attribute conversion. Free online SVG to JSX converter — no installation required."
        path="/svg-jsx"
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
            href="/docs/svg-jsx"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
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
            onChange={(e) => {
              handleChange(e.target.value);
            }}
            placeholder={PLACEHOLDER}
            spellCheck={false}
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>JSX</span>
            <CopyButton value={jsx} variant="ghost" size="sm" disabled={!jsx} />
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

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
