import { useCallback, useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import styles from "../../styles/compress.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { ReferenceLinks } from "@/components/ReferenceLinks";

type OutputFormat = "png" | "webp" | "avif";

const FORMAT_QUALITY_DEFAULTS: Record<OutputFormat, number> = {
  png: 85,
  webp: 80,
  avif: 50,
};

type FileEntry = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "compressing" | "done" | "error";
  originalSize: number;
  compressedSize?: number;
  downloadUrl?: string;
  compressedFilename?: string;
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function savings(
  original: number,
  compressed: number,
): { pct: number; label: string } {
  const pct = ((original - compressed) / original) * 100;
  return { pct, label: `${Math.abs(pct).toFixed(1)}%` };
}

export default function CompressPage() {
  const branding = useBranding();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(FORMAT_QUALITY_DEFAULTS["png"]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);

  const updateEntry = useCallback((id: string, patch: Partial<FileEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  }, []);

  const processNext = useCallback(
    async (
      currentEntries: FileEntry[],
      currentFormat: OutputFormat,
      currentQuality: number,
    ) => {
      if (processingRef.current) return;
      const next = currentEntries.find((e) => e.status === "queued");
      if (!next) return;

      processingRef.current = true;
      const { id, file } = next;

      try {
        // Step 1: upload to Vercel Blob
        updateEntry(id, { status: "uploading" });
        const blob = await upload(file.name, file, {
          access: "private",
          handleUploadUrl: "/api/compress/upload",
        });

        // Step 2: compress via API
        updateEntry(id, { status: "compressing" });
        const res = await fetch("/api/compress/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: blob.url,
            format: currentFormat,
            filename: file.name,
            quality: currentQuality,
          }),
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: "Compression failed" }));
          updateEntry(id, {
            status: "error",
            error: "Please try again later.",
          });
        } else {
          const compressedBlob = await res.blob();
          const compressedSize =
            parseInt(res.headers.get("X-Compressed-Size") ?? "0", 10) ||
            compressedBlob.size;
          const ext =
            currentFormat === "png"
              ? ".png"
              : currentFormat === "webp"
                ? ".webp"
                : ".avif";
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const compressedFilename = `compressed-${baseName}${ext}`;
          const downloadUrl = URL.createObjectURL(compressedBlob);
          updateEntry(id, {
            status: "done",
            compressedSize,
            downloadUrl,
            compressedFilename,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        updateEntry(id, {
          status: "error",
          error: "Please try again later.",
        });
      } finally {
        processingRef.current = false;
        // Trigger next in queue
        setEntries((prev) => {
          const stillQueued = prev.find((e) => e.status === "queued");
          if (stillQueued) {
            setTimeout(() => processNext(prev, currentFormat, currentQuality), 0);
          }
          return prev;
        });
      }
    },
    [updateEntry],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const valid = files.filter((f) => f.type.startsWith("image/"));
      if (!valid.length) return;

      const newEntries: FileEntry[] = valid.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: "queued",
        originalSize: file.size,
      }));

      setEntries((prev) => {
        const next = [...prev, ...newEntries];
        setTimeout(() => processNext(next, format, quality), 0);
        return next;
      });
    },
    [format, quality, processNext],
  );

  useEffect(() => {
    setQuality(FORMAT_QUALITY_DEFAULTS[format]);
  }, [format]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    },
    [addFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addFiles(files);
    e.target.value = "";
  };

  const handleDownload = (entry: FileEntry) => {
    if (!entry.downloadUrl || !entry.compressedFilename) return;
    const a = document.createElement("a");
    a.href = entry.downloadUrl;
    a.download = entry.compressedFilename;
    a.click();
  };

  const handleClear = () => {
    entries.forEach((e) => {
      if (e.downloadUrl) URL.revokeObjectURL(e.downloadUrl);
    });
    setEntries([]);
    queueRef.current = [];
  };

  const statusLabel = (entry: FileEntry) => {
    switch (entry.status) {
      case "queued":
        return "Queued";
      case "uploading":
        return "Uploading…";
      case "compressing":
        return "Compressing…";
      case "done":
        return "Done";
      case "error":
        return entry.error ?? "Error";
    }
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="Image Compressor"
        description="Compress PNG, JPEG, and WebP images with side-by-side comparison. Convert to WebP or AVIF. Free online image compressor — no installation required."
        path="/compress"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/compress"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Image Compressor</h1>
        <p className={styles.tagline}>
          Compress PNG, JPEG, and WebP images — convert to WebP or AVIF for
          maximum savings
        </p>
        <ReferenceLinks refs={[{ name: "MIME Types", slug: "mime-types" }]} />
      </div>

      <hr className={styles.divider} />

      <div className={styles.controls}>
        <span className={styles.controlLabel}>Output format</span>
        <div className={styles.toggleGroup}>
          {(["png", "webp", "avif"] as OutputFormat[]).map((f) => (
            <button
              key={f}
              className={`${styles.toggleBtn}${format === f ? ` ${styles.active}` : ""}`}
              onClick={() => setFormat(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <span className={styles.controlLabel}>
          {format === "png" ? "Compression" : "Quality"}
        </span>
        <input
          type="range"
          min={1}
          max={100}
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className={styles.qualitySlider}
        />
        <span className={styles.qualityValue}>{quality}</span>
      </div>

      <div
        className={`${styles.dropZone}${dragging ? ` ${styles.dragging}` : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenInput}
          onChange={handleFileInput}
        />
        <span className={styles.dropZoneIcon}>⬆</span>
        <span className={styles.dropZoneText}>
          Drop images here or <span className={styles.browseLink}>browse</span>
        </span>
        <span className={styles.dropZoneHint}>
          PNG, JPEG, WebP — up to 50 MB each
        </span>
      </div>

      {entries.length > 0 && (
        <>
          <div className={styles.fileList}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`${styles.fileRow} ${styles[entry.status]}`}
              >
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{entry.file.name}</span>
                  <span className={styles.fileSizes}>
                    {formatBytes(entry.originalSize)}
                    {entry.compressedSize !== undefined && (
                      <>
                        {" → "}
                        {formatBytes(entry.compressedSize)}
                        {(() => {
                          const { pct, label } = savings(
                            entry.originalSize,
                            entry.compressedSize,
                          );
                          return (
                            <span
                              className={styles.savingsBadge}
                              style={pct < 0 ? { color: "#f87171" } : undefined}
                            >
                              {pct < 0 ? "+" : "−"}
                              {label}
                            </span>
                          );
                        })()}
                      </>
                    )}
                  </span>
                </div>
                <div className={styles.fileActions}>
                  {entry.status === "done" ? (
                    <button
                      className={styles.downloadBtn}
                      onClick={() => handleDownload(entry)}
                    >
                      Download
                    </button>
                  ) : (
                    <span
                      className={`${styles.statusLabel} ${styles[`status_${entry.status}`]}`}
                    >
                      {statusLabel(entry)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.listFooter}>
            <button className={styles.clearBtn} onClick={handleClear}>
              Clear all
            </button>
          </div>
        </>
      )}

      <hr className={styles.divider} />

      <div className={styles.infoRow}>
        <span className={styles.infoText}>
          Files are processed server-side with{" "}
          <a
            href="https://sharp.pixelplumbing.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.infoLink}
          >
            sharp
          </a>{" "}
          and deleted after compression.
        </span>
      </div>
    </div>
  );
}
