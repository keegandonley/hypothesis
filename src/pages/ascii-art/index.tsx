import { useCallback, useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import styles from "../../styles/ascii-art.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

type ImageAdjustments = {
  brightness: number; // 50–200, where 100 = unchanged
  contrast: number;   // 50–200, where 100 = unchanged
  sharpness: number;  // 0–100
  grayscale: boolean;
};

const DEFAULT_ADJ: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  sharpness: 0,
  grayscale: false,
};

const CHAR_SETS = {
  simple: " .:-=+*#%@",
  detailed:
    " .'`^\",;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
} as const;
type CharSetKey = keyof typeof CHAR_SETS;

function applySharpen(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = data[idx + c];
        const top    = y > 0          ? data[((y - 1) * width + x) * 4 + c] : center;
        const bottom = y < height - 1 ? data[((y + 1) * width + x) * 4 + c] : center;
        const left   = x > 0          ? data[(y * width + (x - 1)) * 4 + c] : center;
        const right  = x < width - 1  ? data[(y * width + (x + 1)) * 4 + c] : center;
        // Sharpen kernel: 5×center − top − bottom − left − right
        const sharpened = 5 * center - top - bottom - left - right;
        out[idx + c] = Math.max(0, Math.min(255, Math.round(center * (1 - amount) + sharpened * amount)));
      }
      out[idx + 3] = data[idx + 3];
    }
  }
  return out;
}

function renderAscii(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  cols: number,
  charSet: string,
  invert: boolean,
  adj: ImageAdjustments,
  charAspect: number,
): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const rows = Math.max(
    1,
    Math.round((cols / img.naturalWidth) * img.naturalHeight * charAspect),
  );
  canvas.width = cols;
  canvas.height = rows;

  // Apply CSS filters before drawing (brightness, contrast, grayscale are free)
  const filters: string[] = [];
  if (adj.brightness !== 100) filters.push(`brightness(${adj.brightness / 100})`);
  if (adj.contrast !== 100) filters.push(`contrast(${adj.contrast / 100})`);
  if (adj.grayscale) filters.push("grayscale(1)");
  ctx.filter = filters.length > 0 ? filters.join(" ") : "none";
  ctx.drawImage(img, 0, 0, cols, rows);
  ctx.filter = "none";

  // Sharpen via convolution on the sampled grid
  const imageData = ctx.getImageData(0, 0, cols, rows);
  const data: Uint8ClampedArray =
    adj.sharpness > 0
      ? applySharpen(imageData.data, cols, rows, adj.sharpness / 100)
      : imageData.data;

  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Rec. 709 perceptual luminance
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      // invert=true: bright→dense (good for dark bg); invert=false: bright→sparse (good for print)
      const normalized = invert ? lum : 1 - lum;
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
  const measureRef = useRef<HTMLSpanElement>(null);
  // charAspect = charWidth / lineHeight — measured from the actual rendered font
  const charAspectRef = useRef<number>(0.5);

  const [cols, setCols] = useState(80);
  const [charSetKey, setCharSetKey] = useState<CharSetKey>("detailed");
  const [invert, setInvert] = useState(true);

  const [brightness, setBrightness] = useState(DEFAULT_ADJ.brightness);
  const [contrast, setContrast] = useState(DEFAULT_ADJ.contrast);
  const [sharpness, setSharpness] = useState(DEFAULT_ADJ.sharpness);
  const [grayscale, setGrayscale] = useState(DEFAULT_ADJ.grayscale);

  const [asciiOutput, setAsciiOutput] = useState("");
  const [asciiCopied, setAsciiCopied] = useState(false);

  const asciiCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const triggerRender = useCallback(
    (
      img: HTMLImageElement,
      c: number,
      cs: CharSetKey,
      inv: boolean,
      adj: ImageAdjustments,
      charAspect: number,
    ) => {
      if (!canvasRef.current) return;
      const output = renderAscii(img, canvasRef.current, c, CHAR_SETS[cs], inv, adj, charAspect);
      setAsciiOutput(output);
    },
    [],
  );

  // Measure actual rendered character width whenever the char set changes.
  // Block elements (░▒▓█) can have a different advance width than ASCII chars in
  // some fonts, which would skew the aspect ratio if we used a hardcoded factor.
  // This effect must be declared before the re-render effect so it runs first.
  useEffect(() => {
    if (!measureRef.current) return;
    const chars = CHAR_SETS[charSetKey];
    measureRef.current.textContent = chars[Math.floor(chars.length / 2)];
    const charW = measureRef.current.getBoundingClientRect().width;
    const lineH = parseFloat(getComputedStyle(measureRef.current).lineHeight);
    if (charW > 0 && lineH > 0) {
      charAspectRef.current = charW / lineH;
    }
  }, [charSetKey]);

  // Re-render when any control changes
  useEffect(() => {
    if (!imgRef.current) return;
    triggerRender(imgRef.current, cols, charSetKey, invert, {
      brightness,
      contrast,
      sharpness,
      grayscale,
    }, charAspectRef.current);
  }, [cols, charSetKey, invert, brightness, contrast, sharpness, grayscale, triggerRender]);


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
        triggerRender(img, cols, charSetKey, invert, { brightness, contrast, sharpness, grayscale }, charAspectRef.current);
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
      triggerRender(img, cols, charSetKey, invert, { brightness, contrast, sharpness, grayscale }, charAspectRef.current);
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
    setBrightness(DEFAULT_ADJ.brightness);
    setContrast(DEFAULT_ADJ.contrast);
    setSharpness(DEFAULT_ADJ.sharpness);
    setGrayscale(DEFAULT_ADJ.grayscale);
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="ASCII Art Generator"
        description="Convert text to ASCII art using dozens of fonts and styles. Free online ASCII art generator — no installation required. No data sent to servers."
        path="/ascii-art"
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
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={grayscale}
              onChange={(e) => setGrayscale(e.target.checked)}
              className={styles.checkbox}
            />
            Grayscale
          </label>
        </div>

        <div className={styles.controlsSeparator} />

        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Brightness</span>
          <input
            type="range"
            min={10}
            max={200}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className={styles.widthSlider}
          />
          <span className={styles.sliderValue}>{brightness}%</span>
          <button
            className={styles.sliderReset}
            onClick={() => setBrightness(DEFAULT_ADJ.brightness)}
            disabled={brightness === DEFAULT_ADJ.brightness}
            title="Reset"
          >reset</button>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Contrast</span>
          <input
            type="range"
            min={10}
            max={200}
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className={styles.widthSlider}
          />
          <span className={styles.sliderValue}>{contrast}%</span>
          <button
            className={styles.sliderReset}
            onClick={() => setContrast(DEFAULT_ADJ.contrast)}
            disabled={contrast === DEFAULT_ADJ.contrast}
            title="Reset"
          >reset</button>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Sharpness</span>
          <input
            type="range"
            min={0}
            max={100}
            value={sharpness}
            onChange={(e) => setSharpness(Number(e.target.value))}
            className={styles.widthSlider}
          />
          <span className={styles.sliderValue}>{sharpness}</span>
          <button
            className={styles.sliderReset}
            onClick={() => setSharpness(DEFAULT_ADJ.sharpness)}
            disabled={sharpness === DEFAULT_ADJ.sharpness}
            title="Reset"
          >reset</button>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          {imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              className={styles.preview}
              alt="Loaded image preview"
              style={{
                filter: [
                  brightness !== 100 ? `brightness(${brightness / 100})` : null,
                  contrast !== 100 ? `contrast(${contrast / 100})` : null,
                  grayscale ? "grayscale(1)" : null,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined,
              }}
            />
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
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "7px",
          lineHeight: "1.2",
          whiteSpace: "pre",
        }}
      />

      <hr className={styles.divider} />

      <div className={styles.footerRow}>
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
