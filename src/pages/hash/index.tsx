import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/hash.module.css";
import { CopyButton, PageLayout, PermalinkRow, Panel, PanelHeader } from "@/components/ui";

const SHA_ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
const ALGOS = ["MD5", ...SHA_ALGOS] as const;

// Pure-JS MD5 (no dependencies). RFC 1321.
function md5(bytes: Uint8Array): string {
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];
  const T = Array.from(
    { length: 64 },
    (_, i) => (Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0,
  );

  const msgLen = bytes.length;
  const padLen = msgLen % 64 < 56 ? 56 - (msgLen % 64) : 120 - (msgLen % 64);
  const padded = new Uint8Array(msgLen + padLen + 8);

  padded.set(bytes);
  padded[msgLen] = 0x80;
  const dv = new DataView(padded.buffer);

  dv.setUint32(msgLen + padLen, (msgLen * 8) >>> 0, true);
  dv.setUint32(msgLen + padLen + 4, Math.floor(msgLen / 0x20000000), true);

  let a0 = 0x67452301,
    b0 = 0xefcdab89,
    c0 = 0x98badcfe,
    d0 = 0x10325476;

  for (let off = 0; off < padded.length; off += 64) {
    const M = Array.from({ length: 16 }, (_, i) =>
      dv.getUint32(off + i * 4, true),
    );
    let a = a0,
      b = b0,
      c = c0,
      d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number, g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      f = (f + a + T[i] + M[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((f << S[i]) | (f >>> (32 - S[i])))) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);

  odv.setUint32(0, a0, true);
  odv.setUint32(4, b0, true);
  odv.setUint32(8, c0, true);
  odv.setUint32(12, d0, true);

  return Array.from(out)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashBytes(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const bytes = new Uint8Array(buffer);
  const results: Record<string, string> = {};

  results.MD5 = md5(bytes);
  for (const algo of SHA_ALGOS) {
    const buf = await crypto.subtle.digest(algo, buffer);

    results[algo] = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  return results;
}

async function hashText(text: string): Promise<Record<string, string>> {
  const encoded = new TextEncoder().encode(text);

  return hashBytes(encoded.buffer);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;

  return `${(n / 1073741824).toFixed(1)} GB`;
}

export default function HashPage(): React.ReactNode {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildUrl = (val: string): string => {
    if (!val) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?value=${encodeURIComponent(val)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("value");

    if (v) {
      setInput(v); // eslint-disable-line react-hooks/set-state-in-effect
      void hashText(v).then(setHashes);
    }

    setUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!input) {
      setHashes({}); // eslint-disable-line react-hooks/set-state-in-effect

      return;
    }

    void hashText(input).then(setHashes);
  }, [input]);

  const handleInputChange = (value: string): void => {
    setInput(value);
    const newUrl = buildUrl(value);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setInput("");
    setHashes({});
    setFileName(null);
    setFileSize(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleModeChange = (newMode: "text" | "file"): void => {
    setMode(newMode);
    setHashes({});
    setFileName(null);
    setFileSize(null);
    setInput("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleFile = (file: File): void => {
    setFileName(file.name);
    setFileSize(file.size);
    void file.arrayBuffer().then((buf) => hashBytes(buf).then(setHashes));
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Hash Generator"
        metaDescription="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text. Free online hash generator — no installation required. No data sent to servers."
        path="/hash"
        h1="Hash Generator"
        tagline="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text or file"
      >

      <div className={styles.inputPanel}>
        <PanelHeader label="Input">
            <div className={styles.modeTabs} role="tablist">
            <button
              role="tab"
              aria-selected={mode === "text"}
              className={`${styles.modeTab}${mode === "text" ? ` ${styles.modeTabActive}` : ""}`}
              onClick={() => {
                handleModeChange("text");
              }}
            >
              Text
            </button>
            <button
              role="tab"
              aria-selected={mode === "file"}
              className={`${styles.modeTab}${mode === "file" ? ` ${styles.modeTabActive}` : ""}`}
              onClick={() => {
                handleModeChange("file");
              }}
            >
              File
            </button>
          </div>
        </PanelHeader>
        {mode === "text" ? (
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => {
              handleInputChange(e.target.value);
            }}
            placeholder="Enter text to hash..."
            spellCheck={false}
          />
        ) : (
          <div
            className={`${styles.dropZone}${isDragging ? ` ${styles.dropZoneDragging}` : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => {
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];

              if (file) handleFile(file);
            }}
          >
            {fileName ? (
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{fileName}</span>
                <span className={styles.fileSizeLabel}>
                  {formatBytes(fileSize ?? 0)}
                </span>
              </div>
            ) : (
              <span className={styles.dropZoneHint}>
                Drop a file here or click to browse
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>

      <div className={styles.hashList}>
        {ALGOS.map((algo) => {
          const value = hashes[algo] ?? "";

          return (
            <div key={algo} className={styles.hashRow}>
              <span className={styles.algoLabel}>{algo}</span>
              <span
                className={`${styles.hashValue}${!value ? ` ${styles.hashValueEmpty}` : ""}`}
              >
                {value || "—"}
              </span>
              <CopyButton value={value} variant="copy" size="xs" disabled={!value} />
            </div>
          );
        })}
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <div style={mode === "file" ? { display: "none" } : undefined}>
        <PermalinkRow url={url} onReset={handleReset} />
      </div>
    </div>
  );
}
