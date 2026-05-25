import React, { useState, useEffect } from "react";
import styles from "@/styles/bytes.module.css";
import { CopyButton, PageLayout, PermalinkRow } from "@/components/ui";

type Mode = "binary" | "decimal";

const BINARY_UNITS = [
  { unit: "B", name: "Bytes", factor: 1 },
  { unit: "KiB", name: "Kibibytes", factor: 1024 },
  { unit: "MiB", name: "Mebibytes", factor: 1024 ** 2 },
  { unit: "GiB", name: "Gibibytes", factor: 1024 ** 3 },
  { unit: "TiB", name: "Tebibytes", factor: 1024 ** 4 },
  { unit: "PiB", name: "Pebibytes", factor: 1024 ** 5 },
];

const DECIMAL_UNITS = [
  { unit: "B", name: "Bytes", factor: 1 },
  { unit: "KB", name: "Kilobytes", factor: 1000 },
  { unit: "MB", name: "Megabytes", factor: 1000 ** 2 },
  { unit: "GB", name: "Gigabytes", factor: 1000 ** 3 },
  { unit: "TB", name: "Terabytes", factor: 1000 ** 4 },
  { unit: "PB", name: "Petabytes", factor: 1000 ** 5 },
];

function formatValue(bytes: number, factor: number): string {
  const n = bytes / factor;

  if (n === 0) return "0";

  return parseFloat(n.toPrecision(10)).toLocaleString(undefined, {
    maximumSignificantDigits: 10,
  });
}

export default function BytesPage(): React.ReactNode {
  const [rawValue, setRawValue] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("B");
  const [mode, setMode] = useState<Mode>("binary");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("value");
    const u = params.get("unit");
    const m = params.get("mode");

    if (v) setRawValue(v); // eslint-disable-line react-hooks/set-state-in-effect
    if (u) setSelectedUnit(u);
    if (m === "decimal" || m === "binary") setMode(m);
    setUrl(window.location.href);
  }, []);

  function updateUrl(v: string, u: string, m: Mode): void {
    const params = new URLSearchParams();

    if (v) params.set("value", v);
    if (u !== "B") params.set("unit", u);
    if (m !== "binary") params.set("mode", m);
    const qs = params.toString();

    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    setUrl(window.location.href);
  }

  function handleValue(v: string): void {
    setRawValue(v);
    updateUrl(v, selectedUnit, mode);
  }

  function handleUnit(u: string): void {
    setSelectedUnit(u);
    updateUrl(rawValue, u, mode);
  }

  function handleMode(m: Mode): void {
    // When switching modes, try to keep the unit name or fall back to B
    const units = m === "binary" ? BINARY_UNITS : DECIMAL_UNITS;
    const match = units.find((u) => u.unit === selectedUnit);
    const newUnit = match ? selectedUnit : "B";

    setMode(m);
    setSelectedUnit(newUnit);
    updateUrl(rawValue, newUnit, m);
  }

  const units = mode === "binary" ? BINARY_UNITS : DECIMAL_UNITS;
  const inputUnit = units.find((u) => u.unit === selectedUnit) ?? units[0];

  // Parse input to bytes
  let bytes: number | null = null;
  const numVal = parseFloat(rawValue);

  if (rawValue !== "" && !isNaN(numVal) && numVal >= 0) {
    bytes = numVal * inputUnit.factor;
  }

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Byte Size Converter"
        metaDescription="Convert between bytes, kilobytes, megabytes, gigabytes, and more instantly. Free online byte size converter — no installation required. No data sent to servers."
        path="/bytes"
        h1="Byte Size"
        tagline="Convert between byte units with binary (1024) or decimal (1000) base."
      >

      <div className={styles.inputRow}>
        <select
          className={styles.unitSelect}
          value={selectedUnit}
          onChange={(e) => {
            handleUnit(e.target.value);
          }}
        >
          {units.map((u) => (
            <option key={u.unit} value={u.unit}>
              {u.unit}
            </option>
          ))}
        </select>
        <input
          className={styles.numberInput}
          type="number"
          min="0"
          value={rawValue}
          onChange={(e) => {
            handleValue(e.target.value);
          }}
          placeholder="Enter a value..."
          autoComplete="off"
        />
      </div>

      <div className={styles.modeRow}>
        <span className={styles.modeLabel}>Base</span>
        <button
          className={`${styles.modeBtn} ${mode === "binary" ? styles.modeBtnActive : ""}`}
          onClick={() => {
            handleMode("binary");
          }}
        >
          Binary (1024)
        </button>
        <button
          className={`${styles.modeBtn} ${mode === "decimal" ? styles.modeBtnActive : ""}`}
          onClick={() => {
            handleMode("decimal");
          }}
        >
          Decimal (1000)
        </button>
      </div>

      <div className={styles.table}>
        {units.map((u, idx) => {
          const display = bytes !== null ? formatValue(bytes, u.factor) : "—";
          const isActive = u.unit === selectedUnit;

          return (
            <div
              key={u.unit}
              className={`${styles.tableRow} ${isActive ? styles.tableRowActive : ""}`}
            >
              <div>
                <div className={styles.unitLabel}>{u.unit}</div>
                <div className={styles.unitFull}>{u.name}</div>
              </div>
              <span
                className={
                  bytes !== null ? styles.valueCell : styles.valueCellMuted
                }
              >
                {display}
              </span>
              {bytes !== null && <CopyButton value={display.replace(/,/g, "")} variant="copy" size="xs" />}
            </div>
          );
        })}
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={() => {
        setRawValue("");
        setSelectedUnit("B");
        setMode("binary");
        history.replaceState(null, "", window.location.pathname);
        setUrl(window.location.href);
      }} />
    </div>
  );
}
