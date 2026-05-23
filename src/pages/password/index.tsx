import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "@/styles/password.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";

type Strength = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

const STRENGTH_FILL: Record<Strength, number> = {
  "very-weak": 1,
  weak: 2,
  fair: 3,
  strong: 4,
  "very-strong": 5,
};
const STRENGTH_COLORS: Record<Strength, string> = {
  "very-weak": "#ef4444",
  weak: "#f97316",
  fair: "#eab308",
  strong: "#84cc16",
  "very-strong": "#22c55e",
};
const STRENGTH_LABELS: Record<Strength, string> = {
  "very-weak": "Very Weak",
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  "very-strong": "Very Strong",
};

function formatCrackTime(entropy: number): string {
  if (entropy <= 0) return "instant";
  const seconds = Math.pow(2, entropy) / 1e10 / 2;

  if (seconds < 0.001) return "instant";
  if (seconds < 1) return "less than a second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
  if (seconds < 3.154e13)
    return `${Math.round(seconds / 3153600000)} centuries`;

  return "effectively uncrackable";
}

function analyzePassword(pw: string): {
  entropy: number;
  length: number;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigits: boolean;
  hasSymbols: boolean;
  strength: Strength;
  crackTime: string;
} {
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigits = /[0-9]/.test(pw);
  const hasSymbols = /[^A-Za-z0-9]/.test(pw);
  let charsetSize = 0;

  if (hasUpper) charsetSize += 26;
  if (hasLower) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSymbols) charsetSize += 32;
  const entropy = charsetSize > 0 ? pw.length * Math.log2(charsetSize) : 0;
  const strength: Strength =
    entropy < 28
      ? "very-weak"
      : entropy < 36
        ? "weak"
        : entropy < 60
          ? "fair"
          : entropy < 128
            ? "strong"
            : "very-strong";

  return {
    entropy,
    length: pw.length,
    hasUpper,
    hasLower,
    hasDigits,
    hasSymbols,
    strength,
    crackTime: formatCrackTime(entropy),
  };
}

function generatePasswords(
  length: number,
  upper: boolean,
  lower: boolean,
  digits: boolean,
  symbols: boolean,
  count: number,
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
        .join(""),
    );
  }

  return results;
}

export default function PasswordPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();

  const [mode, setMode] = useState<"generate" | "check">("generate");

  // generate state
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [count, setCount] = useState(5);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // check state
  const [checkInput, setCheckInput] = useState("");
  const [showCheckPw, setShowCheckPw] = useState(false);

  const [url, setUrl] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const copyTimeouts = useRef<
    Map<number | "all", ReturnType<typeof setTimeout>>
  >(new Map());

  const analysis = checkInput ? analyzePassword(checkInput) : null;

  const generate = useCallback(() => {
    setPasswords(
      generatePasswords(length, upper, lower, digits, symbols, count),
    );
  }, [length, upper, lower, digits, symbols, count]);

  function updateUrl(
    l: number,
    u: boolean,
    lo: boolean,
    d: boolean,
    s: boolean,
    c: number,
  ): void {
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("mode") === "check") {
      setMode("check"); // eslint-disable-line react-hooks/set-state-in-effect
      const checkUrl = `${window.location.origin}${window.location.pathname}?mode=check`;

      history.replaceState(null, "", checkUrl);
      setUrl(checkUrl);

      return;
    }

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

  function handleModeChange(newMode: "generate" | "check"): void {
    setMode(newMode);
    setCheckInput("");
    if (newMode === "check") {
      const checkUrl = `${window.location.origin}${window.location.pathname}?mode=check`;

      history.replaceState(null, "", checkUrl);
      setUrl(checkUrl);
    } else {
      updateUrl(length, upper, lower, digits, symbols, count);
    }
  }

  function setLengthAndSync(v: number): void {
    setLength(v);
    updateUrl(v, upper, lower, digits, symbols, count);
  }

  function setUpperAndSync(v: boolean): void {
    setUpper(v);
    updateUrl(length, v, lower, digits, symbols, count);
  }

  function setLowerAndSync(v: boolean): void {
    setLower(v);
    updateUrl(length, upper, v, digits, symbols, count);
  }

  function setDigitsAndSync(v: boolean): void {
    setDigits(v);
    updateUrl(length, upper, lower, v, symbols, count);
  }

  function setSymbolsAndSync(v: boolean): void {
    setSymbols(v);
    updateUrl(length, upper, lower, digits, v, count);
  }

  function setCountAndSync(v: number): void {
    setCount(v);
    updateUrl(length, upper, lower, digits, symbols, v);
  }

  function handleCopy(value: string, idx: number): void {
    void copyToClipboard(value);
    setCopiedIdx(idx);
    const prev = copyTimeouts.current.get(idx);

    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      setCopiedIdx((c) => (c === idx ? null : c));
    }, 1500);

    copyTimeouts.current.set(idx, t);
  }

  function handleCopyAll(): void {
    void copyToClipboard(passwords.join("\n"));
    setCopiedAll(true);
    const prev = copyTimeouts.current.get("all");

    if (prev) clearTimeout(prev);
    const t = setTimeout(() => {
      setCopiedAll(false);
    }, 1500);

    copyTimeouts.current.set("all", t);
  }

  function handleReset(): void {
    if (mode === "check") {
      setCheckInput("");

      return;
    }

    setLength(20);
    setUpper(true);
    setLower(true);
    setDigits(true);
    setSymbols(false);
    setCount(5);
    setPasswords([]);
    history.replaceState(null, "", window.location.pathname);
    setUrl(window.location.href);
  }

  const noCharset = !upper && !lower && !digits && !symbols;

  return (
    <div className={styles.page}>
      <ToolHead
        title="Password Generator"
        description="Generate cryptographically secure passwords and check the strength of existing ones. Free, no installation required. No data sent to servers."
        path="/password"
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
            href="/docs/password"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
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

      <div className={styles.modeTabs} role="tablist">
        <button
          role="tab"
          aria-selected={mode === "generate"}
          className={`${styles.modeTab}${mode === "generate" ? ` ${styles.modeTabActive}` : ""}`}
          onClick={() => {
            handleModeChange("generate");
          }}
        >
          Generate
        </button>
        <button
          role="tab"
          aria-selected={mode === "check"}
          className={`${styles.modeTab}${mode === "check" ? ` ${styles.modeTabActive}` : ""}`}
          onClick={() => {
            handleModeChange("check");
          }}
        >
          Check
        </button>
      </div>

      {mode === "generate" && (
        <>
          <div className={styles.controls}>
            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Length</span>
              <input
                className={styles.slider}
                type="range"
                min={4}
                max={128}
                value={length}
                onChange={(e) => {
                  setLengthAndSync(Number(e.target.value));
                }}
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
                    onChange={(e) => {
                      setUpperAndSync(e.target.checked);
                    }}
                  />
                  A–Z
                </label>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={lower}
                    onChange={(e) => {
                      setLowerAndSync(e.target.checked);
                    }}
                  />
                  a–z
                </label>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={digits}
                    onChange={(e) => {
                      setDigitsAndSync(e.target.checked);
                    }}
                  />
                  0–9
                </label>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={symbols}
                    onChange={(e) => {
                      setSymbolsAndSync(e.target.checked);
                    }}
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
                  onClick={() => {
                    setCountAndSync(Math.max(1, count - 1));
                  }}
                >
                  −
                </button>
                <span className={styles.countValue}>{count}</span>
                <button
                  className={styles.countBtn}
                  onClick={() => {
                    setCountAndSync(Math.min(20, count + 1));
                  }}
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
                      onClick={() => {
                        handleCopy(pw, idx);
                      }}
                    >
                      {copiedIdx === idx ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "check" && (
        <>
          <div className={styles.checkPanel}>
            <div className={styles.checkPanelHeader}>
              <span className={styles.panelLabel}>Password</span>
              <button
                className={styles.showHideBtn}
                onClick={() => {
                  setShowCheckPw((v) => !v);
                }}
                type="button"
              >
                {showCheckPw ? "hide" : "show"}
              </button>
            </div>
            <input
              type={showCheckPw ? "text" : "password"}
              className={styles.checkInput}
              value={checkInput}
              onChange={(e) => {
                setCheckInput(e.target.value);
              }}
              placeholder="Enter a password to analyze"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {analysis && (
            <>
              <div className={styles.meterRow}>
                <div className={styles.meter}>
                  {[1, 2, 3, 4, 5].map((seg) => (
                    <div
                      key={seg}
                      className={styles.meterSegment}
                      style={{
                        backgroundColor:
                          seg <= STRENGTH_FILL[analysis.strength]
                            ? STRENGTH_COLORS[analysis.strength]
                            : undefined,
                      }}
                    />
                  ))}
                </div>
                <span
                  className={styles.strengthLabel}
                  style={{ color: STRENGTH_COLORS[analysis.strength] }}
                >
                  {STRENGTH_LABELS[analysis.strength]}
                </span>
              </div>

              <div className={styles.statsCard}>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Entropy</span>
                  <span className={styles.statValue}>
                    {analysis.entropy.toFixed(1)} bits
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Length</span>
                  <span className={styles.statValue}>
                    {analysis.length} characters
                  </span>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Charset</span>
                  <div className={styles.charBadges}>
                    {(
                      [
                        ["A-Z", analysis.hasUpper],
                        ["a-z", analysis.hasLower],
                        ["0-9", analysis.hasDigits],
                        ["!@#", analysis.hasSymbols],
                      ] as [string, boolean][]
                    ).map(([label, active]) => (
                      <span
                        key={label}
                        className={`${styles.charBadge}${active ? ` ${styles.charBadgeActive}` : ""}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Crack time</span>
                  <span className={styles.statValue}>{analysis.crackTime}</span>
                </div>
                <div className={styles.crackNote}>
                  Assumes 10 billion guesses/sec (offline fast-hash attack)
                </div>
              </div>
            </>
          )}
        </>
      )}

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${copiedUrl ? ` ${styles.copied}` : ""}`}
            onClick={() => {
              void copyToClipboard(url);
              setCopiedUrl(true);
              setTimeout(() => {
                setCopiedUrl(false);
              }, 1500);
            }}
          >
            {copiedUrl ? "Copied!" : "Copy"}
          </button>
        )}
        {!isIframe && mode === "generate" && passwords.length > 0 && (
          <button
            className={`${styles.copyAllBtn} ${copiedAll ? styles.copied : ""}`}
            onClick={handleCopyAll}
          >
            {copiedAll ? "Copied!" : "Copy all"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
