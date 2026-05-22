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
type QrMode = "text" | "wifi" | "vcard";
type WifiSecurity = "WPA" | "WEP" | "nopass";

const EC_LEVELS: ECLevel[] = ["L", "M", "Q", "H"];
const EC_DESCRIPTIONS: Record<ECLevel, string> = {
  L: "~7% correction",
  M: "~15% correction",
  Q: "~25% correction",
  H: "~30% correction",
};

interface WifiState {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}

interface VCardState {
  first: string;
  last: string;
  phone: string;
  email: string;
  org: string;
  url: string;
}

const EMPTY_WIFI: WifiState = { ssid: "", password: "", security: "WPA", hidden: false };
const EMPTY_VCARD: VCardState = { first: "", last: "", phone: "", email: "", org: "", url: "" };

function escapeWifi(s: string): string {
  return s.replace(/([\\;,"])/g, "\\$1");
}

function buildWifiString(w: WifiState): string {
  if (!w.ssid) return "";
  const p = w.security !== "nopass" && w.password ? `P:${escapeWifi(w.password)};` : "";
  return `WIFI:T:${w.security};S:${escapeWifi(w.ssid)};${p}H:${w.hidden};;`;
}

function buildVCardString(v: VCardState): string {
  const fn = [v.first, v.last].filter(Boolean).join(" ");
  if (!fn && !v.phone && !v.email && !v.org && !v.url) return "";
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (fn) {
    lines.push(`FN:${fn}`);
    lines.push(`N:${v.last};${v.first};;;`);
  }
  if (v.phone) lines.push(`TEL;TYPE=CELL:${v.phone}`);
  if (v.email) lines.push(`EMAIL:${v.email}`);
  if (v.org) lines.push(`ORG:${v.org}`);
  if (v.url) lines.push(`URL:${v.url}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

function getQrString(mode: QrMode, text: string, wifi: WifiState, vcard: VCardState): string {
  if (mode === "text") return text;
  if (mode === "wifi") return buildWifiString(wifi);
  return buildVCardString(vcard);
}

export default function QrPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();

  const [mode, setMode] = useState<QrMode>("text");
  const [value, setValue] = useState("https://hypothesis.sh");
  const [wifi, setWifi] = useState<WifiState>(EMPTY_WIFI);
  const [vcard, setVcard] = useState<VCardState>(EMPTY_VCARD);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  const [ecLevel, setEcLevel] = useState<ECLevel>("M");
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState("");
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [permalinkCopied, setPermalinkCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permalinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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

  const buildUrl = (m: QrMode, ec: ECLevel, textVal: string, w: WifiState, vc: VCardState): string => {
    const params = new URLSearchParams();
    params.set("ecl", ec);
    if (m === "text") {
      if (textVal) params.set("value", textVal);
    } else if (m === "wifi") {
      params.set("mode", "wifi");
      if (w.ssid) params.set("ssid", w.ssid);
      if (w.password && w.security !== "nopass") params.set("wpass", w.password);
      if (w.security !== "WPA") params.set("sec", w.security);
      if (w.hidden) params.set("hidden", "1");
    } else {
      params.set("mode", "vcard");
      if (vc.first) params.set("fn", vc.first);
      if (vc.last) params.set("ln", vc.last);
      if (vc.phone) params.set("tel", vc.phone);
      if (vc.email) params.set("email", vc.email);
      if (vc.org) params.set("org", vc.org);
      if (vc.url) params.set("url", vc.url);
    }
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ecParam = params.get("ecl") as ECLevel | null;
    const ec: ECLevel = ecParam && EC_LEVELS.includes(ecParam) ? ecParam : "M";
    const modeParam = params.get("mode");
    setEcLevel(ec);

    if (modeParam === "wifi") {
      const w: WifiState = {
        ssid: params.get("ssid") ?? "",
        password: params.get("wpass") ?? "",
        security: (params.get("sec") as WifiSecurity) ?? "WPA",
        hidden: params.get("hidden") === "1",
      };
      setMode("wifi");
      setWifi(w);
      generateQR(buildWifiString(w), ec);
      const url = buildUrl("wifi", ec, "", w, EMPTY_VCARD);
      history.replaceState(null, "", url);
      setPageUrl(url);
    } else if (modeParam === "vcard") {
      const vc: VCardState = {
        first: params.get("fn") ?? "",
        last: params.get("ln") ?? "",
        phone: params.get("tel") ?? "",
        email: params.get("email") ?? "",
        org: params.get("org") ?? "",
        url: params.get("url") ?? "",
      };
      setMode("vcard");
      setVcard(vc);
      generateQR(buildVCardString(vc), ec);
      const url = buildUrl("vcard", ec, "", EMPTY_WIFI, vc);
      history.replaceState(null, "", url);
      setPageUrl(url);
    } else {
      const v = params.get("value") ?? "https://hypothesis.sh";
      setValue(v);
      generateQR(v, ec);
      const url = buildUrl("text", ec, v, EMPTY_WIFI, EMPTY_VCARD);
      history.replaceState(null, "", url);
      setPageUrl(url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (newMode: QrMode) => {
    setMode(newMode);
    setSvgContent("");
    setError("");
    setValue("");
    setWifi(EMPTY_WIFI);
    setVcard(EMPTY_VCARD);
    const url = buildUrl(newMode, ecLevel, "", EMPTY_WIFI, EMPTY_VCARD);
    history.replaceState(null, "", url);
    setPageUrl(url);
  };

  const handleValueChange = (v: string) => {
    setValue(v);
    generateQR(v, ecLevel);
    const url = buildUrl("text", ecLevel, v, wifi, vcard);
    history.replaceState(null, "", url);
    setPageUrl(url);
  };

  const handleWifiChange = (updates: Partial<WifiState>) => {
    const next = { ...wifi, ...updates };
    setWifi(next);
    generateQR(buildWifiString(next), ecLevel);
    const url = buildUrl("wifi", ecLevel, "", next, vcard);
    history.replaceState(null, "", url);
    setPageUrl(url);
  };

  const handleVcardChange = (updates: Partial<VCardState>) => {
    const next = { ...vcard, ...updates };
    setVcard(next);
    generateQR(buildVCardString(next), ecLevel);
    const url = buildUrl("vcard", ecLevel, "", wifi, next);
    history.replaceState(null, "", url);
    setPageUrl(url);
  };

  const handleEcChange = (ec: ECLevel): void => {
    setEcLevel(ec);
    generateQR(getQrString(mode, value, wifi, vcard), ec);
    const url = buildUrl(mode, ec, value, wifi, vcard);
    history.replaceState(null, "", url);
    setPageUrl(url);
  };

  const handleReset = () => {
    setSvgContent("");
    setError("");
    setValue("");
    setWifi(EMPTY_WIFI);
    setVcard(EMPTY_VCARD);
    const url = buildUrl(mode, ecLevel, "", EMPTY_WIFI, EMPTY_VCARD);
    history.replaceState(null, "", url);
    setPageUrl(url);
  };

  const handleCopyPermalink = (): void => {
    void copyToClipboard(pageUrl).then(() => {
      setPermalinkCopied(true);
      if (permalinkTimeoutRef.current)
        clearTimeout(permalinkTimeoutRef.current);
      permalinkTimeoutRef.current = setTimeout(() => {
        setPermalinkCopied(false);
      }, 1500);
    });
  };

  const handleDownloadSvg = (): void => {
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
    const qrStr = getQrString(mode, value, wifi, vcard);
    if (!qrStr.trim()) return;
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, qrStr, {
      errorCorrectionLevel: ecLevel,
      margin: 2,
      width: 512,
      color: { dark: "#000000", light: "#ffffff" },
    });
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  const handleCopySvg = (): void => {
    if (!svgContent) return;
    void copyToClipboard(svgContent).then(() => {
      setCopiedSvg(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedSvg(false);
      }, 1500);
    });
  };

  const hasContent = !!getQrString(mode, value, wifi, vcard).trim();

  const emptyStateText =
    mode === "wifi" ? "Enter a network name to generate a QR code" :
    mode === "vcard" ? "Enter contact details to generate a QR code" :
    "Enter text to generate a QR code";

  return (
    <div className={styles.page}>
      <ToolHead
        title="QR Code Generator"
        description="Generate QR codes from text, URLs, WiFi credentials, and contact cards. Download as SVG or PNG. Free online QR code generator — no installation required. No data sent to servers."
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
          Generate QR codes from text, WiFi credentials, or contact cards
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.inputPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Input</span>
              <div className={styles.modeTabs}>
                {(["text", "wifi", "vcard"] as QrMode[]).map((m) => (
                  <button
                    key={m}
                    className={`${styles.modeTab}${mode === m ? ` ${styles.modeTabActive}` : ""}`}
                    onClick={() => handleModeChange(m)}
                  >
                    {m === "text" ? "Text" : m === "wifi" ? "WiFi" : "vCard"}
                  </button>
                ))}
              </div>
            </div>

            {mode === "text" && (
              <textarea
                className={styles.textarea}
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="Enter text or URL..."
                spellCheck={false}
              />
            )}

            {mode === "wifi" && (
              <div className={styles.form}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>SSID</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={wifi.ssid}
                    onChange={(e) => handleWifiChange({ ssid: e.target.value })}
                    placeholder="Network name"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.formInputWrapper}>
                    <input
                      type={showWifiPassword ? "text" : "password"}
                      className={`${styles.formInput} ${styles.formInputWithBtn}`}
                      value={wifi.password}
                      onChange={(e) => handleWifiChange({ password: e.target.value })}
                      placeholder={wifi.security === "nopass" ? "No password" : "Password"}
                      disabled={wifi.security === "nopass"}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      className={styles.formInlineBtn}
                      onClick={() => setShowWifiPassword((v) => !v)}
                      type="button"
                      disabled={wifi.security === "nopass"}
                    >
                      {showWifiPassword ? "hide" : "show"}
                    </button>
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Security</label>
                  <div className={styles.toggleGroup}>
                    {(["WPA", "WEP", "nopass"] as WifiSecurity[]).map((s) => (
                      <button
                        key={s}
                        className={`${styles.toggleBtn}${wifi.security === s ? ` ${styles.active}` : ""}`}
                        onClick={() => handleWifiChange({ security: s })}
                      >
                        {s === "nopass" ? "None" : s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Hidden network</label>
                  <div className={styles.toggleGroup}>
                    {([false, true] as boolean[]).map((h) => (
                      <button
                        key={String(h)}
                        className={`${styles.toggleBtn}${wifi.hidden === h ? ` ${styles.active}` : ""}`}
                        onClick={() => handleWifiChange({ hidden: h })}
                      >
                        {h ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === "vcard" && (
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>First name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={vcard.first}
                      onChange={(e) => handleVcardChange({ first: e.target.value })}
                      placeholder="Jane"
                      spellCheck={false}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Last name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={vcard.last}
                      onChange={(e) => handleVcardChange({ last: e.target.value })}
                      placeholder="Doe"
                      spellCheck={false}
                    />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Phone</label>
                  <input
                    type="tel"
                    className={styles.formInput}
                    value={vcard.phone}
                    onChange={(e) => handleVcardChange({ phone: e.target.value })}
                    placeholder="+1 555 000 0000"
                    spellCheck={false}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={vcard.email}
                    onChange={(e) => handleVcardChange({ email: e.target.value })}
                    placeholder="jane@example.com"
                    spellCheck={false}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Organization</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={vcard.org}
                    onChange={(e) => handleVcardChange({ org: e.target.value })}
                    placeholder="Acme Corp"
                    spellCheck={false}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>URL</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={vcard.url}
                    onChange={(e) => handleVcardChange({ url: e.target.value })}
                    placeholder="https://example.com"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.settingsRow}>
            <span className={styles.settingLabel}>Error Correction</span>
            <div className={styles.toggleGroup}>
              {EC_LEVELS.map((ec) => (
                <button
                  key={ec}
                  className={`${styles.toggleBtn}${ecLevel === ec ? ` ${styles.active}` : ""}`}
                  onClick={() => {
                    handleEcChange(ec);
                  }}
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
              <button className={styles.actionBtn} disabled={!svgContent} onClick={handleDownloadSvg}>
                Download SVG
              </button>
              <button className={styles.actionBtn} disabled={!hasContent} onClick={handleDownloadPng}>
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
              <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: svgContent }} />
            )}
            {!svgContent && !error && (
              <div className={styles.emptyState}>{emptyStateText}</div>
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
