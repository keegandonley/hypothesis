import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/hash.module.css";
import { CopyButton, PageLayout, PermalinkRow, Panel, PanelHeader } from "@/components/ui";
import { SHA_ALGOS, ALGOS, hashBytes, hashText, formatBytes } from "@/lib/hash";
import { useUrlSync } from "@/lib/useUrlSync";

export default function HashPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [mode, setMode] = useState<"text" | "file">("text");
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Monotonic id per hash request: async digests can resolve out of order
  // (large input hashed slowly, then a short one quickly), so only the
  // latest request may write results.
  const hashSeqRef = useRef(0);

  const applyHashes = (result: Record<string, string>, seq: number): void => {
    if (seq === hashSeqRef.current) setHashes(result);
  };

  const buildUrl = (val: string): string => {
    if (!val) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?value=${encodeURIComponent(val)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("value");

    // Restoring input here is enough — the [input] effect below hashes it.
    if (v) setInput(v); // eslint-disable-line react-hooks/set-state-in-effect

    setUrl(window.location.href);
  }, []);

  useEffect(() => {
    const seq = ++hashSeqRef.current;

    if (!input) {
      setHashes({}); // eslint-disable-line react-hooks/set-state-in-effect

      return;
    }

    void hashText(input).then((result) => {
      applyHashes(result, seq);
    });
  }, [input]);

  const handleInputChange = (value: string): void => {
    setInput(value);
    const newUrl = buildUrl(value);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    hashSeqRef.current++; // invalidate any in-flight hash
    setInput("");
    setHashes({});
    setFileName(null);
    setFileSize(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  const handleModeChange = (newMode: "text" | "file"): void => {
    hashSeqRef.current++; // invalidate any in-flight hash
    setMode(newMode);
    setHashes({});
    setFileName(null);
    setFileSize(null);
    setInput("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  const handleFile = (file: File): void => {
    setFileName(file.name);
    setFileSize(file.size);
    const seq = ++hashSeqRef.current;

    void file.arrayBuffer().then(async (buf) => {
      applyHashes(await hashBytes(buf), seq);
    });
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

      <hr className={styles.divider} />

      {/* File mode has no permalink (a file can't be encoded in a URL). */}
      <PermalinkRow url={url} onReset={handleReset} muted={mode === "file"} />
      </PageLayout>
    </div>
  );
}
