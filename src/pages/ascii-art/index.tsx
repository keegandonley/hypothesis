import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/ascii-art.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

const CHAR_SETS = {
  simple: " .:-=+*#%@",
  detailed:
    " .'`^\",;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
} as const;
type CharSetKey = keyof typeof CHAR_SETS;

function renderAscii(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  cols: number,
  charSet: string,
  invert: boolean,
): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const rows = Math.max(
    1,
    Math.round((cols / img.naturalWidth) * img.naturalHeight * 0.5),
  );
  canvas.width = cols;
  canvas.height = rows;

  ctx.drawImage(img, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);

  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Rec. 709 perceptual luminance
      const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      // invert=true: bright→dense (good for dark bg); invert=false: bright→sparse (good for print)
      const normalized = invert ? brightness : 1 - brightness;
      const charIndex = Math.min(
        charSet.length - 1,
        Math.floor(normalized * charSet.length),
      );
      line += charSet[charIndex];
    }
    lines.push(line);
  }
  return lines.join("\n");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export default function AsciiArtPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();

  const [inputMode, setInputMode] = useState<"file" | "url">("file");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cols, setCols] = useState(80);
  const [charSetKey, setCharSetKey] = useState<CharSetKey>("detailed");
  const [invert, setInvert] = useState(true);

  const [asciiOutput, setAsciiOutput] = useState("");
  const [asciiCopied, setAsciiCopied] = useState(false);

  const asciiCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const triggerRender = useCallback(
    (img: HTMLImageElement, c: number, cs: CharSetKey, inv: boolean) => {
      if (!canvasRef.current) return;
      const output = renderAscii(
        img,
        canvasRef.current,
        c,
        CHAR_SETS[cs],
        inv,
      );
      setAsciiOutput(output);
    },
    [],
  );

  // Re-render when controls change
  useEffect(() => {
    if (!imgRef.current) return;
    triggerRender(imgRef.current, cols, charSetKey, invert);
  }, [cols, charSetKey, invert, triggerRender]);


  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target!.result as string;
      try {
        const img = await loadImage(dataUrl);
        imgRef.current = img;
        setImageSrc(dataUrl);
        setUrlError("");
        triggerRender(img, cols, charSetKey, invert);
      } catch {
        setUrlError("Could not decode image");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;
    setUrlError("");
    try {
      const img = await loadImage(urlInput.trim());
      imgRef.current = img;
      setImageSrc(urlInput.trim());
      triggerRender(img, cols, charSetKey, invert);
    } catch {
      setUrlError("Could not load image — check the URL or CORS policy");
    }
  };

  const handleColsChange = (c: number) => setCols(c);

  const handleCharSetChange = (cs: CharSetKey) => setCharSetKey(cs);

  const handleInvertChange = (inv: boolean) => setInvert(inv);

  const handleCopyAscii = () => {
    if (!asciiOutput) return;
    copyToClipboard(asciiOutput).then(() => {
      setAsciiCopied(true);
      if (asciiCopyTimeoutRef.current)
        clearTimeout(asciiCopyTimeoutRef.current);
      asciiCopyTimeoutRef.current = setTimeout(
        () => setAsciiCopied(false),
        1500,
      );
    });
  };

  const handleReset = () => {
    imgRef.current = null;
    setImageSrc(null);
    setAsciiOutput("");
    setUrlInput("");
    setUrlError("");
    setCols(80);
    setCharSetKey("detailed");
    setInvert(true);
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — ASCII ART`}</title>
        <meta
          name="description"
          content="Convert images to ASCII art in your browser — upload a file or paste a URL, with configurable width and character density."
        />
        <meta property="og:title" content="ASCII Art" />
        <meta
          property="og:description"
          content="Convert images to ASCII art in your browser — upload a file or paste a URL."
        />
        <meta property="og:url" content="https://hypothesis.sh/ascii-art" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="ASCII Art" />
        <meta
          name="twitter:description"
          content="Convert images to ASCII art in your browser — upload a file or paste a URL."
        />
        <link rel="canonical" href="https://hypothesis.sh/ascii-art" />
      </Head>

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
            href="/docs/ascii-art"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>ASCII Art</h1>
        <p className={styles.tagline}>
          Convert images to ASCII art — entirely in your browser
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.controlsCard}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Input</span>
          <div className={styles.toggleGroup}>
            {(["file", "url"] as const).map((m) => (
              <button
                key={m}
                className={`${styles.toggleBtn}${inputMode === m ? ` ${styles.active}` : ""}`}
                onClick={() => setInputMode(m)}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Width</span>
          <input
            type="range"
            min={20}
            max={200}
            value={cols}
            onChange={(e) => handleColsChange(Number(e.target.value))}
            className={styles.widthSlider}
          />
          <span className={styles.sliderValue}>{cols}</span>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Chars</span>
          <div className={styles.toggleGroup}>
            {(["simple", "detailed", "blocks"] as CharSetKey[]).map((k) => (
              <button
                key={k}
                className={`${styles.toggleBtn}${charSetKey === k ? ` ${styles.active}` : ""}`}
                onClick={() => handleCharSetChange(k)}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Options</span>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => handleInvertChange(e.target.checked)}
              className={styles.checkbox}
            />
            Invert
          </label>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} className={styles.preview} alt="Loaded image preview" />
          )}
          {inputMode === "file" ? (
            <div
              className={`${styles.dropZone}${dragging ? ` ${styles.dragging}` : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && fileInputRef.current?.click()
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleFileInput}
              />
              <span className={styles.dropZoneIcon}>⬆</span>
              <span className={styles.dropZoneText}>
                Drop an image or{" "}
                <span className={styles.browseLink}>browse</span>
              </span>
              <span className={styles.dropZoneHint}>PNG, JPEG, WebP, GIF</span>
            </div>
          ) : (
            <div className={styles.urlPanel}>
              <input
                type="text"
                className={styles.urlInput}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlLoad()}
                placeholder="https://example.com/image.jpg"
                spellCheck={false}
              />
              <button className={styles.loadBtn} onClick={handleUrlLoad}>
                Load
              </button>
              {urlError && (
                <span className={styles.urlError}>{urlError}</span>
              )}
            </div>
          )}
        </div>

        <div className={styles.rightCol}>
          <div className={styles.outputPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>ASCII Output</span>
              {asciiOutput && !isIframe && (
                <button
                  className={`${styles.copyAsciiBtn}${asciiCopied ? ` ${styles.copied}` : ""}`}
                  onClick={handleCopyAscii}
                >
                  {asciiCopied ? "COPIED!" : "COPY"}
                </button>
              )}
            </div>
            {asciiOutput ? (
              <pre className={styles.asciiPre}>{asciiOutput}</pre>
            ) : (
              <div className={styles.emptyState}>
                Load an image to generate ASCII art
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <hr className={styles.divider} />

      <div className={styles.footerRow}>
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
