import React, { useEffect, useState } from "react";
import styles from "@/styles/bitwise.module.css";
import { PageLayout, PermalinkRow } from "@/components/ui";
import { useCopyFeedback } from "@/lib/useCopyFeedback";
import { formatBin, OPERATIONS } from "@/lib/bitwise";
import { useUrlSync } from "@/lib/useUrlSync";

export default function BitwisePage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [inputA, setInputA] = useState("60");
  const [inputB, setInputB] = useState("13");
  const { copiedKey, copy: handleCopy } = useCopyFeedback();
  const [url, setUrl] = useState("");

  const parseInput = (val: string): number | null => {
    if (val.trim() === "" || val.trim() === "-") return null;
    const n = parseInt(val, 10);

    if (isNaN(n)) return null;

    return n;
  };

  const a = parseInput(inputA);
  const b = parseInput(inputB);
  const isValid = a !== null && b !== null;

  const buildUrl = (av: string, bv: string): string => {
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

    if (av !== null) setInputA(av); // eslint-disable-line react-hooks/set-state-in-effect
    if (bv !== null) setInputB(bv);
    setUrl(window.location.href);
  }, []);

  const handleChangeA = (val: string): void => {
    setInputA(val);
    const newUrl = buildUrl(val, inputB);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleChangeB = (val: string): void => {
    setInputB(val);
    const newUrl = buildUrl(inputA, val);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setInputA("");
    setInputB("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };


  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Bitwise Operations"
        metaDescription="Perform bitwise AND, OR, XOR, NOT, and shift operations with binary, hex, and decimal visualization. Free online bitwise calculator — no installation required."
        path="/bitwise"
        h1="Bitwise Operations"
        tagline="Visualize AND, OR, XOR, NAND, NOR, and shift operations with binary and decimal output"
      >

      <div className={styles.inputs}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>A</label>
          <input
            className={`${styles.numInput}${a === null && inputA !== "" ? ` ${styles.inputError}` : ""}`}
            type="text"
            value={inputA}
            onChange={(e) => {
              handleChangeA(e.target.value);
            }}
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
            onChange={(e) => {
              handleChangeB(e.target.value);
            }}
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
          const result = isValid ? op.compute(a, b) : null;
          const decStr = result !== null ? String(result) : "—";
          const binStr = result !== null ? formatBin(result) : "—";
          const isCopied = copiedKey === op.key;

          return (
            <div
              key={op.key}
              className={`${styles.tableRow}${!isValid ? ` ${styles.rowDisabled}` : ""}`}
            >
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
                  onClick={() => {
                    handleCopy(op.key, decStr);
                  }}
                >
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </span>
            </div>
          );
        })}
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
