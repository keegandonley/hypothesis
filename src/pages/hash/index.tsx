import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/hash.module.css";
import { CopyButton, PageLayout, PermalinkRow, Panel, PanelHeader } from "@/components/ui";
import { SHA_ALGOS, ALGOS, hashBytes, hashText, formatBytes } from "@/lib/hash";

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
