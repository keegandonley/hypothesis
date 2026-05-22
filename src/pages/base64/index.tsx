import React, { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/base64.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

type Tab = "text" | "image";

export default function Base64Page() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [plain, setPlain] = useState("");
  const [encoded, setEncoded] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plainRef = useRef<HTMLTextAreaElement>(null);

  const [tab, setTab] = useState<Tab>("text");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageDragging, setImageDragging] = useState(false);
  const [imageError, setImageError] = useState<string>("");
  const [imageCopiedRaw, setImageCopiedRaw] = useState(false);
  const [imageCopiedDataUrl, setImageCopiedDataUrl] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const imageCopyRawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const imageCopyDataUrlTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const buildUrl = (enc: string, json: boolean) => {
    if (!enc) return `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({ value: enc });

    if (json) params.set("json", "1");

    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    const jsonParam = params.get("json") === "1";
    const tabParam = params.get("tab");

    if (tabParam === "image") setTab("image");

    if (value) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setEncoded(value);
      try {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        const decoded = decodeURIComponent(escape(atob(value)));

        setPlain(decoded);
        if (jsonParam) {
          try {
            JSON.parse(decoded);
            setJsonValid(true);
          } catch {
            setJsonValid(false);
          }
        }
      } catch {
        setPlain("");
      }
    }

    if (jsonParam) setJsonMode(true);
    setUrl(window.location.href);
  }, []);

  const validateJson = (value: string): void => {
    if (value.length === 0) {
      setJsonValid(null);

      return;
    }

    try {
      JSON.parse(value);
      setJsonValid(true);
    } catch {
      setJsonValid(false);
    }
  };

  const handlePlainChange = (value: string): void => {
    setPlain(value);
    if (jsonMode) validateJson(value);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const enc = btoa(unescape(encodeURIComponent(value)));

    setEncoded(enc);
    const newUrl = buildUrl(enc, jsonMode);

    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleEncodedChange = (value: string): void => {
    setEncoded(value);
    let decoded = "";

    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      decoded = decodeURIComponent(escape(atob(value)));
      setPlain(decoded);
    } catch {
      setPlain("");
    }

    if (jsonMode) validateJson(decoded);
    const newUrl = buildUrl(value, jsonMode);

    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleFormat = (): void => {
    try {
      const formatted = JSON.stringify(JSON.parse(plain), null, 2);

      handlePlainChange(formatted);
    } catch {
      /* no-op */
    }
  };

  const handleJsonToggle = (): void => {
    const next = !jsonMode;

    setJsonMode(next);
    if (next) validateJson(plain);
    else setJsonValid(null);
    const newUrl = buildUrl(encoded, next);

    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handlePlainKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (!jsonMode || e.key !== "Tab") return;
    e.preventDefault();

    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    if (!e.shiftKey) {
      const newVal = val.slice(0, start) + "  " + val.slice(end);

      handlePlainChange(newVal);
      requestAnimationFrame(() => {
        if (plainRef.current) {
          plainRef.current.selectionStart = plainRef.current.selectionEnd =
            start + 2;
        }
      });
    } else {
      const lineStart = val.lastIndexOf("\n", start - 1) + 1;
      const stripped = /^ {1,2}/.exec(val.slice(lineStart))?.[0] ?? "";

      if (stripped.length > 0) {
        const newVal =
          val.slice(0, lineStart) + val.slice(lineStart + stripped.length);

        handlePlainChange(newVal);
        requestAnimationFrame(() => {
          if (plainRef.current) {
            const pos = Math.max(lineStart, start - stripped.length);

            plainRef.current.selectionStart = plainRef.current.selectionEnd =
              pos;
          }
        });
      }
    }
  };

  const handleReset = (): void => {
    setPlain("");
    setEncoded("");
    setJsonMode(false);
    setJsonValid(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(window.location.href);
  };

  const handleCopy = (): void => {
    void copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  const handleTabChange = (next: Tab) => {
    setTab(next);
    const newUrl =
      next === "image"
        ? `${window.location.origin}${window.location.pathname}?tab=image`
        : buildUrl(encoded, jsonMode);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("Unsupported file type. Please drop an image.");
      return;
    }
    if (file.size / (1024 * 1024) > 5) {
      setImageError(
        `Warning: large file (${(file.size / 1024 / 1024).toFixed(1)} MB). Output may be very long.`,
      );
    } else {
      setImageError("");
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target!.result as string;
      setImageDataUrl(dataUrl);
      setImageBase64(dataUrl.split(",")[1] ?? "");
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragging(true);
  };

  const handleImageDragLeave = () => setImageDragging(false);

  const handleImageFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  };

  const handleCopyRaw = () => {
    copyToClipboard(imageBase64).then(() => {
      setImageCopiedRaw(true);
      if (imageCopyRawTimeoutRef.current)
        clearTimeout(imageCopyRawTimeoutRef.current);
      imageCopyRawTimeoutRef.current = setTimeout(
        () => setImageCopiedRaw(false),
        1500,
      );
    });
  };

  const handleCopyDataUrl = () => {
    copyToClipboard(imageDataUrl).then(() => {
      setImageCopiedDataUrl(true);
      if (imageCopyDataUrlTimeoutRef.current)
        clearTimeout(imageCopyDataUrlTimeoutRef.current);
      imageCopyDataUrlTimeoutRef.current = setTimeout(
        () => setImageCopiedDataUrl(false),
        1500,
      );
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="Base64 Encoder / Decoder"
        description="Encode and decode Base64 strings instantly. Free online Base64 encoder/decoder — no installation required. No data sent to servers."
        path="/base64"
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
            href="/docs/base64"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Base64</h1>
        <p className={styles.tagline}>Encode and decode base64 strings</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.tabRow}>
        {(["text", "image"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`${styles.tabBtn}${tab === t ? ` ${styles.tabBtnActive}` : ""}`}
            onClick={() => handleTabChange(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "text" ? (
        <div className={styles.panels}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>
                {jsonMode ? "JSON" : "Plain Text"}
              </span>
              <div className={styles.panelHeaderRight}>
                <button
                  className={`${styles.toggleBtn}${jsonMode ? ` ${styles.active}` : ""}`}
                  onClick={handleJsonToggle}
                >
                  JSON Mode {jsonMode ? "ON" : "OFF"}
                </button>
                {jsonMode ? (
                  plain.length > 0 &&
                  (jsonValid ? (
                    <span className={styles.badge}>valid</span>
                  ) : (
                    <span className={styles.badgeError}>invalid</span>
                  ))
                ) : (
                  <span className={styles.badge}>{plain.length} chars</span>
                )}
              </div>
            </div>
            <div className={styles.textareaWrapper}>
              <textarea
                ref={plainRef}
                className={styles.textarea}
                value={plain}
                onChange={(e) => handlePlainChange(e.target.value)}
                onKeyDown={handlePlainKeyDown}
                placeholder={`Type or paste ${jsonMode ? "JSON" : "plain text"} here...`}
                spellCheck={false}
              />
              {jsonMode && (
                <button
                  className={styles.formatBtn}
                  disabled={!jsonValid}
                  onClick={handleFormat}
                >
                  Format
                </button>
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Base64</span>
              <span className={styles.badge}>{encoded.length} chars</span>
            </div>
            <div className={styles.textareaWrapper}>
              <textarea
                className={styles.textarea}
                value={encoded}
                onChange={(e) => handleEncodedChange(e.target.value)}
                placeholder="Paste base64 here..."
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.imagePanels}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Image</span>
              {imageFile && (
                <span className={styles.badge}>{imageFile.name}</span>
              )}
            </div>
            <div
              className={`${styles.imageDropZone}${imageDragging ? ` ${styles.imageDropZoneDragging}` : ""}`}
              onDrop={handleImageDrop}
              onDragOver={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              onClick={() => imageFileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && imageFileInputRef.current?.click()
              }
            >
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleImageFileInput}
              />
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageDataUrl}
                  className={styles.imagePreview}
                  alt="Preview"
                />
              ) : (
                <>
                  <span className={styles.dropZoneIcon}>↑</span>
                  <span className={styles.dropZoneText}>
                    Drop an image or{" "}
                    <span className={styles.browseLink}>browse</span>
                  </span>
                  <span className={styles.dropZoneHint}>Any image format</span>
                </>
              )}
            </div>
            {imageError && <p className={styles.imageError}>{imageError}</p>}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Raw Base64</span>
              <span className={styles.badge}>{imageBase64.length} chars</span>
            </div>
            <div className={styles.textareaWrapper}>
              <textarea
                className={styles.textarea}
                value={imageBase64}
                readOnly
                placeholder="Encode an image to see its raw base64 string..."
                spellCheck={false}
              />
              {imageBase64 && !isIframe && (
                <button
                  className={`${styles.formatBtn}${imageCopiedRaw ? ` ${styles.formatBtnCopied}` : ""}`}
                  onClick={handleCopyRaw}
                >
                  {imageCopiedRaw ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className={styles.panelHeaderDivided}>
              <span className={styles.panelLabel}>Data URL</span>
              <span className={styles.badge}>{imageDataUrl.length} chars</span>
            </div>
            <div className={styles.textareaWrapper}>
              <textarea
                className={styles.textarea}
                value={imageDataUrl}
                readOnly
                placeholder="data:image/png;base64,..."
                spellCheck={false}
              />
              {imageDataUrl && !isIframe && (
                <button
                  className={`${styles.formatBtn}${imageCopiedDataUrl ? ` ${styles.formatBtnCopied}` : ""}`}
                  onClick={handleCopyDataUrl}
                >
                  {imageCopiedDataUrl ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <hr className={styles.divider} />

      <div
        className={`${styles.permalinkRow}${tab === "image" ? ` ${styles.permalinkRowMuted}` : ""}`}
        data-permalink-row
      >
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
