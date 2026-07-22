import { useEffect, useRef, useState } from "react";
import styles from "@/styles/qr.module.css";
import { useIsIframe } from "@/lib/useIsIframe";
import QRCode from "qrcode";
import { Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import {
  type ECLevel, type QrMode, type WifiState, type WifiSecurity, type VCardState,
  EC_LEVELS, EC_DESCRIPTIONS, EMPTY_WIFI, EMPTY_VCARD,
  buildWifiString, buildVCardString, getQrString,
} from "@/lib/qr";
import { useUrlSync } from "@/lib/useUrlSync";

export default function QrPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const isIframe = useIsIframe();

  const [mode, setMode] = useState<QrMode>("text");
  const [value, setValue] = useState("https://hypothesis.sh");
  const [wifi, setWifi] = useState<WifiState>(EMPTY_WIFI);
  const [vcard, setVcard] = useState<VCardState>(EMPTY_VCARD);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  const [ecLevel, setEcLevel] = useState<ECLevel>("M");
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  // Monotonic id per generation: QRCode.toString is async, so a slow render
  // kicked off by an earlier keystroke must not overwrite a newer one.
  const generateSeqRef = useRef(0);

  const generateQR = async (text: string, ec: ECLevel): Promise<void> => {
    const seq = ++generateSeqRef.current;

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

      if (seq !== generateSeqRef.current) return;
      setSvgContent(svg);
      setError("");
    } catch (e) {
      if (seq !== generateSeqRef.current) return;
      setSvgContent("");
      setError(e instanceof Error ? e.message : "Failed to generate QR code");
    }
  };

  const buildUrl = (
    m: QrMode,
    ec: ECLevel,
    textVal: string,
    w: WifiState,
    vc: VCardState,
  ): string => {
    const params = new URLSearchParams();

    params.set("ecl", ec);
    if (m === "text") {
      if (textVal) params.set("value", textVal);
    } else if (m === "wifi") {
      params.set("mode", "wifi");
      if (w.ssid) params.set("ssid", w.ssid);
      if (w.password && w.security !== "nopass")
        params.set("wpass", w.password);
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

    setEcLevel(ec); // eslint-disable-line react-hooks/set-state-in-effect

    if (modeParam === "wifi") {
      const w: WifiState = {
        ssid: params.get("ssid") ?? "",
        password: params.get("wpass") ?? "",
        security: (params.get("sec") as WifiSecurity) ?? "WPA",
        hidden: params.get("hidden") === "1",
      };

      setMode("wifi");
      setWifi(w);
      void generateQR(buildWifiString(w), ec);
      const url = buildUrl("wifi", ec, "", w, EMPTY_VCARD);

      replaceUrlNow(url);
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
      void generateQR(buildVCardString(vc), ec);
      const url = buildUrl("vcard", ec, "", EMPTY_WIFI, vc);

      replaceUrlNow(url);
      setPageUrl(url);
    } else {
      const v = params.get("value") ?? "https://hypothesis.sh";

      setValue(v);
      void generateQR(v, ec);
      const url = buildUrl("text", ec, v, EMPTY_WIFI, EMPTY_VCARD);

      replaceUrlNow(url);
      setPageUrl(url);
    }
    // replaceUrlNow is a stable useCallback; this mount effect runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (newMode: QrMode): void => {
    generateSeqRef.current++; // invalidate any in-flight generation
    setMode(newMode);
    setSvgContent("");
    setError("");
    setValue("");
    setWifi(EMPTY_WIFI);
    setVcard(EMPTY_VCARD);
    const url = buildUrl(newMode, ecLevel, "", EMPTY_WIFI, EMPTY_VCARD);

    replaceUrlNow(url);
    setPageUrl(url);
  };

  const handleValueChange = (v: string): void => {
    setValue(v);
    void generateQR(v, ecLevel);
    const url = buildUrl("text", ecLevel, v, wifi, vcard);

    replaceUrl(url);
    setPageUrl(url);
  };

  const handleWifiChange = (updates: Partial<WifiState>): void => {
    const next = { ...wifi, ...updates };

    setWifi(next);
    void generateQR(buildWifiString(next), ecLevel);
    const url = buildUrl("wifi", ecLevel, "", next, vcard);

    replaceUrl(url);
    setPageUrl(url);
  };

  const handleVcardChange = (updates: Partial<VCardState>): void => {
    const next = { ...vcard, ...updates };

    setVcard(next);
    void generateQR(buildVCardString(next), ecLevel);
    const url = buildUrl("vcard", ecLevel, "", wifi, next);

    replaceUrl(url);
    setPageUrl(url);
  };

  const handleEcChange = (ec: ECLevel): void => {
    setEcLevel(ec);
    void generateQR(getQrString(mode, value, wifi, vcard), ec);
    const url = buildUrl(mode, ec, value, wifi, vcard);

    replaceUrl(url);
    setPageUrl(url);
  };

  const handleReset = (): void => {
    generateSeqRef.current++; // invalidate any in-flight generation
    setSvgContent("");
    setError("");
    setValue("");
    setWifi(EMPTY_WIFI);
    setVcard(EMPTY_VCARD);
    const url = buildUrl(mode, ecLevel, "", EMPTY_WIFI, EMPTY_VCARD);

    replaceUrlNow(url);
    setPageUrl(url);
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

  const handleDownloadPng = async (): Promise<void> => {
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

  const hasContent = !!getQrString(mode, value, wifi, vcard).trim();

  const emptyStateText =
    mode === "wifi"
      ? "Enter a network name to generate a QR code"
      : mode === "vcard"
        ? "Enter contact details to generate a QR code"
        : "Enter text to generate a QR code";

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="QR Code Generator"
        metaDescription="Generate QR codes from text, URLs, WiFi credentials, and contact cards. Download as SVG or PNG. Free online QR code generator — no installation required. No data sent to servers."
        path="/qr"
        h1="QR Code"
        tagline="Generate QR codes from text, WiFi credentials, or contact cards"
      >

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <Panel>
            <PanelHeader label="Input">
              <div className={styles.modeTabs} role="tablist">
                {(["text", "wifi", "vcard"] as QrMode[]).map((m) => (
                  <Button
                    key={m}
                    variant="tab"
                    role="tab"
                    aria-selected={mode === m}
                    active={mode === m}
                    onClick={() => {
                      handleModeChange(m);
                    }}
                  >
                    {m === "text" ? "Text" : m === "wifi" ? "WiFi" : "vCard"}
                  </Button>
                ))}
              </div>
            </PanelHeader>

            {mode === "text" && (
              <textarea
                className={styles.textarea}
                value={value}
                onChange={(e) => {
                  handleValueChange(e.target.value);
                }}
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
                    onChange={(e) => {
                      handleWifiChange({ ssid: e.target.value });
                    }}
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
                      onChange={(e) => {
                        handleWifiChange({ password: e.target.value });
                      }}
                      placeholder={
                        wifi.security === "nopass" ? "No password" : "Password"
                      }
                      disabled={wifi.security === "nopass"}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      className={styles.formInlineBtn}
                      onClick={() => {
                        setShowWifiPassword((v) => !v);
                      }}
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
                      <Button
                        key={s}
                        variant="toggle"
                        active={wifi.security === s}
                        onClick={() => {
                          handleWifiChange({ security: s });
                        }}
                      >
                        {s === "nopass" ? "None" : s}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Hidden network</label>
                  <div className={styles.toggleGroup}>
                    {([false, true] as boolean[]).map((h) => (
                      <Button
                        key={String(h)}
                        variant="toggle"
                        active={wifi.hidden === h}
                        onClick={() => {
                          handleWifiChange({ hidden: h });
                        }}
                      >
                        {h ? "Yes" : "No"}
                      </Button>
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
                      onChange={(e) => {
                        handleVcardChange({ first: e.target.value });
                      }}
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
                      onChange={(e) => {
                        handleVcardChange({ last: e.target.value });
                      }}
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
                    onChange={(e) => {
                      handleVcardChange({ phone: e.target.value });
                    }}
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
                    onChange={(e) => {
                      handleVcardChange({ email: e.target.value });
                    }}
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
                    onChange={(e) => {
                      handleVcardChange({ org: e.target.value });
                    }}
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
                    onChange={(e) => {
                      handleVcardChange({ url: e.target.value });
                    }}
                    placeholder="https://example.com"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </Panel>

          <div className={styles.settingsRow}>
            <span className={styles.settingLabel}>Error Correction</span>
            <div className={styles.toggleGroup}>
              {EC_LEVELS.map((ec) => (
                <Button
                  key={ec}
                  variant="toggle"
                  active={ecLevel === ec}
                  onClick={() => {
                    handleEcChange(ec);
                  }}
                  title={EC_DESCRIPTIONS[ec]}
                >
                  {ec}
                </Button>
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
                disabled={!hasContent}
                onClick={handleDownloadPng}
              >
                Download PNG
              </button>
              <CopyButton
                value={svgContent}
                variant="ghost"
                disabled={!svgContent}
              />
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
              <div className={styles.emptyState}>{emptyStateText}</div>
            )}
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={pageUrl} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
