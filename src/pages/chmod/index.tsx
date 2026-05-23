import React, { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import styles from "@/styles/chmod.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { Button, CopyButton, PermalinkRow } from "@/components/ui";
import { useIsIframe } from "@/lib/useIsIframe";
import { ReferenceLinks } from "@/components/ReferenceLinks";

type Perms = [number, number, number]; // [owner, group, other]

const PRESETS: { label: string; mode: string }[] = [
  { label: "644", mode: "644" },
  { label: "664", mode: "664" },
  { label: "755", mode: "755" },
  { label: "700", mode: "700" },
  { label: "777", mode: "777" },
];

function parseNumeric(raw: string): Perms | null {
  const trimmed = raw.trim();

  if (!/^[0-7]{3}$/.test(trimmed)) return null;

  return trimmed.split("").map(Number) as Perms;
}

function parseSymbolic(raw: string): Perms | null {
  const trimmed = raw.trim().toLowerCase();

  if (!/^[rwx-]{9}$/.test(trimmed)) return null;
  const groups = [
    trimmed.slice(0, 3),
    trimmed.slice(3, 6),
    trimmed.slice(6, 9),
  ];

  return groups.map((g) => {
    let n = 0;

    if (g.startsWith("r")) n += 4;
    if (g[1] === "w") n += 2;
    if (g[2] === "x") n += 1;

    return n;
  }) as Perms;
}

function toSymbolic(perms: Perms): string {
  return perms
    .map((d) => {
      const r = d & 4 ? "r" : "-";
      const w = d & 2 ? "w" : "-";
      const x = d & 1 ? "x" : "-";

      return r + w + x;
    })
    .join("");
}

function toNumeric(perms: Perms): string {
  return perms.join("");
}

function detectInput(raw: string): "numeric" | "symbolic" | "unknown" {
  if (/^[0-7]{3}$/.test(raw.trim())) return "numeric";
  if (/^[rwx-]{9}$/i.test(raw.trim())) return "symbolic";

  return "unknown";
}

export default function ChmodPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [perms, setPerms] = useState<Perms | null>(null);
  const [error, setError] = useState(false);
  const [url, setUrl] = useState("");


  const buildUrl = (mode: string): string => {
    if (!mode) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?mode=${encodeURIComponent(mode)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");

    if (mode) {
      setInput(mode); // eslint-disable-line react-hooks/set-state-in-effect

      const p = parseNumeric(mode) ?? parseSymbolic(mode);

      if (p) setPerms(p);
    }

    setUrl(window.location.href);
  }, []);

  const handleChange = (raw: string): void => {
    setInput(raw);
    const trimmed = raw.trim();

    if (!trimmed) {
      setPerms(null);
      setError(false);
      const newUrl = buildUrl("");

      history.replaceState(null, "", newUrl);
      setUrl(newUrl);

      return;
    }

    const kind = detectInput(trimmed);

    if (kind === "unknown") {
      setPerms(null);
      setError(trimmed.length >= 3);

      return;
    }

    const p =
      kind === "numeric" ? parseNumeric(trimmed) : parseSymbolic(trimmed);

    if (!p) {
      setPerms(null);
      setError(true);

      return;
    }

    setPerms(p);
    setError(false);
    const newUrl = buildUrl(trimmed);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handlePreset = (mode: string): void => {
    setInput(mode);
    handleChange(mode);
  };

  const handleReset = (): void => {
    setInput("");
    setPerms(null);
    setError(false);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };



  const bits = [
    { label: "Read", bit: 4 },
    { label: "Write", bit: 2 },
    { label: "Execute", bit: 1 },
  ];

  const entities = ["Owner", "Group", "Other"];

  return (
    <div className={styles.page}>
      <ToolHead
        title="Chmod Calculator"
        description="Convert Unix file permissions between numeric (755) and symbolic (rwxr-xr-x) modes. Free online chmod calculator — no installation required. No data sent to servers."
        path="/chmod"
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
            href="/docs/chmod"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>chmod</h1>
        <p className={styles.tagline}>
          Convert between numeric and symbolic Unix file permission modes
        </p>
        <ReferenceLinks
          refs={[
            { name: "Unix Signals", slug: "unix-signals" },
            { name: "Exit Codes", slug: "exit-codes" },
          ]}
        />
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputRow}>
        <input
          className={`${styles.input}${error ? ` ${styles.inputError}` : ""}`}
          value={input}
          onChange={(e) => {
            handleChange(e.target.value);
          }}
          placeholder="e.g. 755 or rwxr-xr-x"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {error && <span className={styles.badgeError}>invalid</span>}
      </div>

      <div className={styles.presetsRow}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`${styles.presetBtn}${input === p.mode ? ` ${styles.presetActive}` : ""}`}
            onClick={() => {
              handlePreset(p.mode);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {perms && (
        <>
          <div className={styles.outputPanels}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>Numeric</span>
                <CopyButton value={toNumeric(perms)} variant="ghost" size="xs" />
              </div>
              <div className={styles.panelValue}>{toNumeric(perms)}</div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>Symbolic</span>
                <CopyButton value={toSymbolic(perms)} variant="ghost" size="xs" />
              </div>
              <div className={styles.panelValue}>{toSymbolic(perms)}</div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}></th>
                  {entities.map((e) => (
                    <th key={e} className={styles.th}>
                      {e}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bits.map(({ label, bit }) => (
                  <tr key={label}>
                    <td className={styles.tdLabel}>{label}</td>
                    {perms.map((d, i) => (
                      <td key={i} className={styles.td}>
                        <span className={d & bit ? styles.check : styles.cross}>
                          {d & bit ? "✓" : "✗"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className={styles.tdLabel}>Octal</td>
                  {perms.map((d, i) => (
                    <td key={i} className={styles.tdMuted}>
                      {d}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
