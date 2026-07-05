import { useState, useEffect, useRef, useCallback } from "react";
import styles from "@/styles/password.module.css";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import {
  STRENGTH_FILL,
  STRENGTH_COLORS,
  STRENGTH_LABELS,
  analyzePassword,
  generatePasswords,
} from "@/lib/password";
import { useUrlSync } from "@/lib/useUrlSync";

export default function PasswordPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
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
  const [copiedAll, setCopiedAll] = useState(false);

  // check state
  const [checkInput, setCheckInput] = useState("");
  const [showCheckPw, setShowCheckPw] = useState(false);

  const [url, setUrl] = useState("");
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

    const newUrl = `${window.location.origin}${window.location.pathname}?${params}`;

    replaceUrl(newUrl);
    setUrl(newUrl);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("mode") === "check") {
      setMode("check"); // eslint-disable-line react-hooks/set-state-in-effect
      const checkUrl = `${window.location.origin}${window.location.pathname}?mode=check`;

      replaceUrlNow(checkUrl);
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
  }, [replaceUrlNow]);

  function handleModeChange(newMode: "generate" | "check"): void {
    setMode(newMode);
    setCheckInput("");
    if (newMode === "check") {
      const checkUrl = `${window.location.origin}${window.location.pathname}?mode=check`;

      replaceUrlNow(checkUrl);
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
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  }

  const noCharset = !upper && !lower && !digits && !symbols;

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Password Generator"
        metaDescription="Generate cryptographically secure passwords and check the strength of existing ones. Free, no installation required. No data sent to servers."
        path="/password"
        h1="Password Generator"
        tagline='Cryptographically secure passwords via crypto.getRandomValues.'
      >

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
                  <CopyButton variant="ghost" size="xs" value={pw} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "check" && (
        <>
          <Panel>
            <PanelHeader label="Password">
              <button
                className={styles.showHideBtn}
                onClick={() => {
                  setShowCheckPw((v) => !v);
                }}
                type="button"
              >
                {showCheckPw ? "hide" : "show"}
              </button>
            </PanelHeader>
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
          </Panel>

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

      <PermalinkRow url={url} onReset={handleReset} />
      {!isIframe && mode === "generate" && passwords.length > 0 && (
        <button
          className={`${styles.copyAllBtn} ${copiedAll ? styles.copied : ""}`}
          onClick={handleCopyAll}
        >
          {copiedAll ? "Copied!" : "Copy all"}
        </button>
      )}
      </PageLayout>
    </div>
  );
}
