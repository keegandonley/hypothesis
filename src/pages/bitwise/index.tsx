import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/bitwise.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

function toBin(n: number): string {
  return (n >>> 0).toString(2).padStart(32, "0");
}

function formatBin(n: number): string {
  const b = toBin(n);
  // Group into 4-bit nibbles for readability
  return b.replace(/(.{4})/g, "$1 ").trim();
}

type Operation = {
  label: string;
  key: string;
  compute: (a: number, b: number) => number;
  description: string;
};

const OPERATIONS: Operation[] = [
  { label: "AND", key: "and", compute: (a, b) => a & b, description: "a & b" },
  { label: "OR",  key: "or",  compute: (a, b) => a | b, description: "a | b" },
  { label: "XOR", key: "xor", compute: (a, b) => a ^ b, description: "a ^ b" },
  { label: "NAND", key: "nand", compute: (a, b) => ~(a & b), description: "~(a & b)" },
  { label: "NOR",  key: "nor",  compute: (a, b) => ~(a | b), description: "~(a | b)" },
  { label: "SHL", key: "shl", compute: (a, _b) => a << 1, description: "a << 1" },
  { label: "SHR", key: "shr", compute: (a, _b) => a >> 1, description: "a >> 1" },
];

export default function BitwisePage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [inputA, setInputA] = useState("60");
  const [inputB, setInputB] = useState("13");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [permalinkCopied, setPermalinkCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permalinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parseInput = (val: string): number | null => {
    if (val.trim() === "" || val.trim() === "-") return null;
    const n = parseInt(val, 10);
    if (isNaN(n)) return null;
    return n;
  };

  const a = parseInput(inputA);
  const b = parseInput(inputB);
  const isValid = a !== null && b !== null;

  const buildUrl = (av: string, bv: string) => {
    const params = new URLSearchParams();
    if (av) params.set("a", av);
    if (bv) params.set("b", bv);
    const qs = params.toString();
    return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ""}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const av = params.get("a");
    const bv = params.get("b");
    if (av !== null) setInputA(av);
    if (bv !== null) setInputB(bv);
    setUrl(window.location.href);
  }, []);

  const handleChangeA = (val: string) => {
    setInputA(val);
    const newUrl = buildUrl(val, inputB);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleChangeB = (val: string) => {
    setInputB(val);
    const newUrl = buildUrl(inputA, val);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = () => {
    setInputA("");
    setInputB("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopyPermalink = () => {
    copyToClipboard(url).then(() => {
      setPermalinkCopied(true);
      if (permalinkTimeoutRef.current) clearTimeout(permalinkTimeoutRef.current);
      permalinkTimeoutRef.current = setTimeout(() => setPermalinkCopied(false), 1500);
    });
  };

  const handleCopy = (key: string, value: string) => {
    copyToClipboard(value).then(() => {
      setCopiedKey(key);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — BITWISE`}</title>
        <meta name="description" content="Visualize bitwise operations (AND, OR, XOR, NAND, NOR, shifts) with binary and decimal output." />
        <meta property="og:title" content="Bitwise Operations" />
        <meta property="og:description" content="Visualize bitwise operations (AND, OR, XOR, NAND, NOR, shifts) with binary and decimal output." />
        <meta property="og:url" content="https://hypothesis.sh/bitwise" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Bitwise Operations" />
        <meta name="twitter:description" content="Visualize bitwise operations (AND, OR, XOR, NAND, NOR, shifts) with binary and decimal output." />
        <link rel="canonical" href="https://hypothesis.sh/bitwise" />
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
            href="/docs/bitwise"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Bitwise Operations</h1>
        <p className={styles.tagline}>
          Visualize AND, OR, XOR, NAND, NOR, and shift operations with binary and decimal output
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputs}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>A</label>
          <input
            className={`${styles.numInput}${a === null && inputA !== "" ? ` ${styles.inputError}` : ""}`}
            type="text"
            value={inputA}
            onChange={(e) => handleChangeA(e.target.value)}
            placeholder="integer"
            spellCheck={false}
          />
          {a !== null && (
            <span className={styles.binPreview}>{formatBin(a)}</span>
          )}
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>B</label>
          <input
            className={`${styles.numInput}${b === null && inputB !== "" ? ` ${styles.inputError}` : ""}`}
            type="text"
            value={inputB}
            onChange={(e) => handleChangeB(e.target.value)}
            placeholder="integer"
            spellCheck={false}
          />
          {b !== null && (
            <span className={styles.binPreview}>{formatBin(b)}</span>
          )}
        </div>
      </div>

      <div className={styles.resultsTable}>
        <div className={styles.tableHeader}>
          <span className={styles.colOp}>Operation</span>
          <span className={styles.colBin}>Binary (32-bit)</span>
          <span className={styles.colDec}>Decimal</span>
          <span className={styles.colCopy}></span>
        </div>
        {OPERATIONS.map((op) => {
          const result = isValid ? op.compute(a!, b!) : null;
          const decStr = result !== null ? String(result) : "—";
          const binStr = result !== null ? formatBin(result) : "—";
          const isCopied = copiedKey === op.key;
          return (
            <div key={op.key} className={`${styles.tableRow}${!isValid ? ` ${styles.rowDisabled}` : ""}`}>
              <span className={styles.colOp}>
                <span className={styles.opBadge}>{op.label}</span>
                <span className={styles.opDesc}>{op.description}</span>
              </span>
              <span className={styles.colBin}>
                <span className={styles.binValue}>{binStr}</span>
              </span>
              <span className={styles.colDec}>
                <span className={styles.decValue}>{decStr}</span>
              </span>
              <span className={styles.colCopy}>
                <button
                  className={`${styles.rowCopyBtn}${isCopied ? ` ${styles.copied}` : ""}`}
                  disabled={!isValid}
                  onClick={() => handleCopy(op.key, decStr)}
                >
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow}>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${permalinkCopied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopyPermalink}
          >
            {permalinkCopied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
