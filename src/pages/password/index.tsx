import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import styles from "@/styles/password.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";

function generatePasswords(
  length: number,
  upper: boolean,
  lower: boolean,
  digits: boolean,
  symbols: boolean,
  count: number
): string[] {
  let charset = "";
  if (upper) charset += UPPER;
  if (lower) charset += LOWER;
  if (digits) charset += DIGITS;
  if (symbols) charset += SYMBOLS;
  if (!charset) return [];

  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    results.push(
      Array.from(arr)
        .map((n) => charset[n % charset.length])
        .join("")
    );
  }
  return results;
}

export default function PasswordPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [count, setCount] = useState(5);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [url, setUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const copyTimeouts = useRef<Map<number | "all", ReturnType<typeof setTimeout>>>(new Map());

  const generate = useCallback(() => {
    setPasswords(generatePasswords(length, upper, lower, digits, symbols, count));
  }, [length, upper, lower, digits, symbols, count]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const l = params.get("len");
    const u = params.get("upper");
    const lo = params.get("lower");
    const d = params.get("digits");
    const s = params.get("symbols");
    const c = params.get("count");
    if (l) setLength(Number(l));
    if (u !== null) setUpper(u === "1");
    if (lo !== null) setLower(lo === "1");
    if (d !== null) setDigits(d === "1");
    if (s !== null) setSymbols(s === "1");
    if (c) setCount(Number(c));
    setUrl(window.location.href);
  }, []);

  function updateUrl(
    l: number,
    u: boolean,
    lo: boolean,
    d: boolean,
    s: boolean,
    c: number
  ) {
    const params = new URLSearchParams({
      len: String(l),
      upper: u ? "1" : "0",
      lower: lo ? "1" : "0",
      digits: d ? "1" : "0",
      symbols: s ? "1" : "0",
      count: String(c),
    });
    history.replaceState(null, "", `?${params}`);
    setUrl(window.location.href);
  }

  function setLengthAndSync(v: number) {
    setLength(v);
    updateUrl(v, upper, lower, digits, symbols, count);
  }
  function setUpperAndSync(v: boolean) {
    setUpper(v);
    updateUrl(length, v, lower, digits, symbols, count);
  }
  function setLowerAndSync(v: boolean) {
    setLower(v);
    updateUrl(length, upper, v, digits, symbols, count);
  }
  function setDigitsAndSync(v: boolean) {
    setDigits(v);
    updateUrl(length, upper, lower, v, symbols, count);
  }
  function setSymbolsAndSync(v: boolean) {
    setSymbols(v);
    updateUrl(length, upper, lower, digits, v, count);
  }
  function setCountAndSync(v: number) {
    setCount(v);
    updateUrl(length, upper, lower, digits, symbols, v);
  }

  function handleCopy(value: string, idx: number) {
    copyToClipboard(value);
    setCopiedIdx(idx);
    const prev = copyTimeouts.current.get(idx);
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    copyTimeouts.current.set(idx, t);
  }

  function handleCopyAll() {
    copyToClipboard(passwords.join("\n"));
    setCopiedAll(true);
    const prev = copyTimeouts.current.get("all");
    if (prev) clearTimeout(prev);
    const t = setTimeout(() => setCopiedAll(false), 1500);
    copyTimeouts.current.set("all", t);
  }

  const noCharset = !upper && !lower && !digits && !symbols;

  return (
    <div className={styles.page}>
      <ToolHead
        title="Password Generator"
        description="Generate cryptographically secure passwords online — configurable length, character sets, and batch generation. Free, no installation required. No data sent to servers."
        path="/password"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link href="/docs/password" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Password Generator</h1>
        <p className={styles.tagline}>
          Cryptographically secure passwords via{" "}
          <code>crypto.getRandomValues</code>.
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Length</span>
          <input
            className={styles.slider}
            type="range"
            min={4}
            max={128}
            value={length}
            onChange={(e) => setLengthAndSync(Number(e.target.value))}
          />
          <span className={styles.sliderValue}>{length}</span>
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Chars</span>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={upper}
                onChange={(e) => setUpperAndSync(e.target.checked)}
              />
              A–Z
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={lower}
                onChange={(e) => setLowerAndSync(e.target.checked)}
              />
              a–z
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={digits}
                onChange={(e) => setDigitsAndSync(e.target.checked)}
              />
              0–9
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={symbols}
                onChange={(e) => setSymbolsAndSync(e.target.checked)}
              />
              symbols
            </label>
          </div>
        </div>

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Count</span>
          <div className={styles.countGroup}>
            <button
              className={styles.countBtn}
              onClick={() => setCountAndSync(Math.max(1, count - 1))}
            >
              −
            </button>
            <span className={styles.countValue}>{count}</span>
            <button
              className={styles.countBtn}
              onClick={() => setCountAndSync(Math.min(20, count + 1))}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {noCharset ? (
        <div className={styles.warningText}>
          Select at least one character set.
        </div>
      ) : (
        <div className={styles.generateRow}>
          <button className={styles.generateBtn} onClick={generate}>
            Generate
          </button>
        </div>
      )}

      {passwords.length > 0 && (
        <div className={styles.passwordList}>
          {passwords.map((pw, idx) => (
            <div key={idx} className={styles.passwordRow}>
              <span className={styles.passwordValue}>{pw}</span>
              {!isIframe && (
                <button
                  className={`${styles.copyBtn} ${copiedIdx === idx ? styles.copied : ""}`}
                  onClick={() => handleCopy(pw, idx)}
                >
                  {copiedIdx === idx ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${copiedUrl ? ` ${styles.copied}` : ""}`}
            onClick={() => {
              copyToClipboard(url);
              setCopiedUrl(true);
              setTimeout(() => setCopiedUrl(false), 1500);
            }}
          >
            {copiedUrl ? "Copied!" : "Copy"}
          </button>
        )}
        {!isIframe && passwords.length > 0 && (
          <button
            className={`${styles.copyAllBtn} ${copiedAll ? styles.copied : ""}`}
            onClick={handleCopyAll}
          >
            {copiedAll ? "Copied!" : "Copy all"}
          </button>
        )}
        <button
          className={styles.resetBtn}
          onClick={() => {
            setLength(20);
            setUpper(true);
            setLower(true);
            setDigits(true);
            setSymbols(false);
            setCount(5);
            setPasswords([]);
            history.replaceState(null, "", window.location.pathname);
            setUrl(window.location.href);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
