import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/json-ts.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

function jsonToTs(input: string, rootName: string, optional: boolean): string {
  const parsed: JsonValue = JSON.parse(input);
  const interfaces: string[] = [];
  const usedNames = new Set<string>();

  function toPascal(s: string): string {
    return s
      .charAt(0)
      .toUpperCase()
      .concat(
        s.slice(1).replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
      );
  }

  function uniqueName(base: string): string {
    const name = toPascal(base);
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    let i = 2;
    while (usedNames.has(`${name}${i}`)) i++;
    usedNames.add(`${name}${i}`);
    return `${name}${i}`;
  }

  function needsQuoting(key: string): boolean {
    return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
  }

  function getType(value: JsonValue, hint: string): string {
    if (value === null) return "null";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (Array.isArray(value)) {
      if (value.length === 0) return "unknown[]";
      const seen = new Set<string>();
      const seenStructures = new Map<string, string>();
      const elHint = hint.replace(/s$/i, "");
      value.forEach((el) => {
        if (el !== null && typeof el === "object" && !Array.isArray(el)) {
          const fingerprint = JSON.stringify(Object.keys(el).sort());
          if (seenStructures.has(fingerprint)) {
            seen.add(seenStructures.get(fingerprint)!);
          } else {
            const typeName = getType(el, elHint);
            seenStructures.set(fingerprint, typeName);
            seen.add(typeName);
          }
        } else {
          seen.add(getType(el, elHint));
        }
      });
      const union = [...seen].join(" | ");
      return seen.size > 1 ? `(${union})[]` : `${union}[]`;
    }
    const name = uniqueName(hint);
    const fields = Object.entries(value)
      .map(([k, v]) => {
        const quotedKey = needsQuoting(k) ? `"${k}"` : k;
        return `  ${quotedKey}${optional ? "?" : ""}: ${getType(v, k)};`;
      })
      .join("\n");
    interfaces.push(`interface ${name} {\n${fields}\n}`);
    return name;
  }

  const rootIsArray = Array.isArray(parsed);

  let elementHint = rootName;
  if (rootIsArray) {
    const singularised = rootName.replace(/s$/i, "");
    elementHint = singularised !== rootName ? singularised : rootName + "Item";
  }

  const rootType = getType(parsed, rootIsArray ? elementHint : rootName);

  if (!interfaces.length) {
    return `type ${toPascal(rootName)} = ${rootType};`;
  }

  const body = interfaces.reverse().join("\n\n");

  if (rootIsArray) {
    return `${body}\n\ntype ${toPascal(rootName)} = ${rootType};`;
  }

  return body;
}

export default function JsonTsPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [jsonInput, setJsonInput] = useState("");
  const [tsOutput, setTsOutput] = useState("");
  const [rootName, setRootName] = useState("Root");
  const [optional, setOptional] = useState(false);
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyOutputTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const buildUrl = (j: string, n: string, o: boolean) => {
    if (!j) return `${window.location.origin}${window.location.pathname}`;
    const payload = btoa(
      unescape(encodeURIComponent(JSON.stringify({ j, n, o })))
    );
    return `${window.location.origin}${window.location.pathname}?v=${payload}`;
  };

  const compute = (j: string, n: string, o: boolean) => {
    if (!j.trim()) {
      setTsOutput("");
      setJsonValid(null);
      return;
    }
    try {
      const result = jsonToTs(j, n || "Root", o);
      setTsOutput(result);
      setJsonValid(true);
    } catch {
      setTsOutput("");
      setJsonValid(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    if (v) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(v))));
        const j = decoded.j ?? "";
        const n = decoded.n ?? "Root";
        const o = decoded.o ?? false;
        setJsonInput(j);
        setRootName(n);
        setOptional(o);
        compute(j, n, o);
      } catch {
        /* no-op */
      }
    }
    setUrl(window.location.href);
  }, []);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    compute(value, rootName, optional);
    const newUrl = buildUrl(value, rootName, optional);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleRootNameChange = (value: string) => {
    setRootName(value);
    compute(jsonInput, value, optional);
    const newUrl = buildUrl(jsonInput, value, optional);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleOptionalToggle = () => {
    const next = !optional;
    setOptional(next);
    compute(jsonInput, rootName, next);
    const newUrl = buildUrl(jsonInput, rootName, next);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = () => {
    setJsonInput("");
    setTsOutput("");
    setRootName("Root");
    setOptional(false);
    setJsonValid(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
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

  const handleCopyOutput = () => {
    copyToClipboard(tsOutput).then(() => {
      setCopiedOutput(true);
      if (copyOutputTimeoutRef.current)
        clearTimeout(copyOutputTimeoutRef.current);
      copyOutputTimeoutRef.current = setTimeout(
        () => setCopiedOutput(false),
        1500
      );
    });
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — JSON → TYPESCRIPT`}</title>
        <meta
          name="description"
          content="Convert a JSON sample into TypeScript interface definitions instantly."
        />
        <meta property="og:title" content="JSON → TypeScript" />
        <meta
          property="og:description"
          content="Convert a JSON sample into TypeScript interface definitions instantly."
        />
        <meta property="og:url" content="https://hypothesis.sh/json-ts" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="JSON → TypeScript" />
        <meta
          name="twitter:description"
          content="Convert a JSON sample into TypeScript interface definitions instantly."
        />
        <link rel="canonical" href="https://hypothesis.sh/json-ts" />
      </Head>

      <div className={styles.header}>
        <div className={styles.eyebrow}>
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
            href="/docs/json-ts"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>JSON → TypeScript</h1>
        <p className={styles.tagline}>
          Convert a JSON sample into TypeScript interface definitions
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>JSON Input</span>
            <div className={styles.panelHeaderRight}>
              {jsonInput.length === 0 ? (
                <span className={styles.badgeReady}>ready</span>
              ) : jsonValid ? (
                <span className={styles.badge}>valid</span>
              ) : (
                <span className={styles.badgeError}>invalid</span>
              )}
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder="Paste JSON here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>TypeScript Output</span>
            <div className={styles.panelHeaderRight}>
              {!isIframe && tsOutput && (
                <button
                  className={`${styles.copyBtn}${copiedOutput ? ` ${styles.copied}` : ""}`}
                  onClick={handleCopyOutput}
                >
                  {copiedOutput ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              value={tsOutput}
              readOnly
              placeholder="TypeScript interfaces will appear here..."
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div className={styles.optionsRow}>
        <label className={styles.optionLabel}>
          <span className={styles.fieldLabel}>Root name</span>
          <input
            className={styles.nameInput}
            type="text"
            value={rootName}
            onChange={(e) => handleRootNameChange(e.target.value)}
            placeholder="Root"
            spellCheck={false}
          />
        </label>
        <button
          className={`${styles.toggleBtn}${optional ? ` ${styles.active}` : ""}`}
          onClick={handleOptionalToggle}
        >
          Optional fields {optional ? "ON" : "OFF"}
        </button>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow}>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.permalinkCopyBtn}${copied ? ` ${styles.copied}` : ""}`}
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
