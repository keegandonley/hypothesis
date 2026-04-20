import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/qr.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import QRCode from "qrcode";

type ECLevel = "L" | "M" | "Q" | "H";
const EC_LEVELS: ECLevel[] = ["L", "M", "Q", "H"];

const EC_DESCRIPTIONS: Record<ECLevel, string> = {
  L: "~7% correction",
  M: "~15% correction",
  Q: "~25% correction",
  H: "~30% correction",
};

export default function QrPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [value, setValue] = useState("https://hypothesis.sh");
  const [ecLevel, setEcLevel] = useState<ECLevel>("M");
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState("");
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [permalinkCopied, setPermalinkCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permalinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (v: string, ec: ECLevel) => {
    const params = new URLSearchParams();
    if (v) params.set("value", v);
    params.set("ecl", ec);
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  const generateQR = async (text: string, ec: ECLevel) => {
    if (!text.trim()) {
      setSvgContent("");
      setError("");
      return;
    }
    try {
      const svg = await QRCode.toString(text, {
        type: "svg",
        errorCorrectionLevel: ec,
        margin: 2,
        color: { dark: "#f0ede8", light: "#13131a" },
      });
      setSvgContent(svg);
      setError("");
    } catch (e) {
      setSvgContent("");
      setError(e instanceof Error ? e.message : "Failed to generate QR code");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("value") ?? "https://hypothesis.sh";
    const ecParam = params.get("ecl") as ECLevel | null;
    const ec: ECLevel = ecParam && EC_LEVELS.includes(ecParam) ? ecParam : "M";
    setValue(v);
    setEcLevel(ec);
    generateQR(v, ec);
    const initialUrl = buildUrl(v, ec);
    history.replaceState(null, "", initialUrl);
    setPageUrl(initialUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValueChange = (v: string) => {
    setValue(v);
    generateQR(v, ecLevel);
    const newUrl = buildUrl(v, ecLevel);
    history.replaceState(null, "", newUrl);
    setPageUrl(newUrl);
  };

  const handleEcChange = (ec: ECLevel) => {
    setEcLevel(ec);
    generateQR(value, ec);
    const newUrl = buildUrl(value, ec);
    history.replaceState(null, "", newUrl);
    setPageUrl(newUrl);
  };

  const handleReset = () => {
    setValue("");
    setSvgContent("");
    setError("");
    const newUrl = `${window.location.origin}${window.location.pathname}?ecl=${ecLevel}`;
    history.replaceState(null, "", newUrl);
    setPageUrl(newUrl);
  };

  const handleCopyPermalink = () => {
    copyToClipboard(pageUrl).then(() => {
      setPermalinkCopied(true);
      if (permalinkTimeoutRef.current) clearTimeout(permalinkTimeoutRef.current);
      permalinkTimeoutRef.current = setTimeout(() => setPermalinkCopied(false), 1500);
    });
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = async () => {
    if (!value.trim()) return;
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, value, {
      errorCorrectionLevel: ecLevel,
      margin: 2,
      width: 512,
      color: { dark: "#000000", light: "#ffffff" },
    });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.png";
    a.click();
  };

  const handleCopySvg = () => {
    if (!svgContent) return;
    copyToClipboard(svgContent).then(() => {
      setCopiedSvg(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedSvg(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="QR Code Generator"
        description="Generate QR codes from any text or URL. Download as SVG or PNG. Free online QR code generator — no installation required. No data sent to servers."
        path="/qr"
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
            href="/docs/qr"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>QR Code</h1>
        <p className={styles.tagline}>
          Generate QR codes from any text or URL — download as SVG or PNG
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.inputPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Input</span>
            </div>
            <textarea
              className={styles.textarea}
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Enter text or URL..."
              spellCheck={false}
            />
          </div>

          <div className={styles.settingsRow}>
            <span className={styles.settingLabel}>Error Correction</span>
            <div className={styles.toggleGroup}>
              {EC_LEVELS.map((ec) => (
                <button
                  key={ec}
                  className={`${styles.toggleBtn}${ecLevel === ec ? ` ${styles.active}` : ""}`}
                  onClick={() => handleEcChange(ec)}
                  title={EC_DESCRIPTIONS[ec]}
                >
                  {ec}
                </button>
              ))}
            </div>
            <span className={styles.ecDesc}>{EC_DESCRIPTIONS[ecLevel]}</span>
          </div>

          {!isIframe && (
            <div className={styles.actions}>
              <button
                className={styles.actionBtn}
                disabled={!svgContent}
                onClick={handleDownloadSvg}
              >
                Download SVG
              </button>
              <button
                className={styles.actionBtn}
                disabled={!value.trim()}
                onClick={handleDownloadPng}
              >
                Download PNG
              </button>
              <button
                className={`${styles.copySvgBtn}${copiedSvg ? ` ${styles.copied}` : ""}`}
                disabled={!svgContent}
                onClick={handleCopySvg}
              >
                {copiedSvg ? "Copied!" : "Copy SVG"}
              </button>
            </div>
          )}
        </div>

        <div className={styles.rightCol}>
          <div className={styles.previewPanel}>
            {error && <div className={styles.errorMsg}>{error}</div>}
            {svgContent && !error && (
              <div
                className={styles.svgWrapper}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            )}
            {!svgContent && !error && (
              <div className={styles.emptyState}>Enter text to generate a QR code</div>
            )}
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{pageUrl}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${permalinkCopied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopyPermalink}
          >
            {permalinkCopied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
