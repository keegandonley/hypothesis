import React, { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/push-test.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";

const DEVICE_ID_LS_KEY = "pushTestDeviceId";

type Result =
  | { status: "ok"; apnsId?: string }
  | { status: "error"; message: string };

export default function PushTestPage() {
  const branding = useBranding();
  const [deviceId, setDeviceId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sound, setSound] = useState("");
  const [badge, setBadge] = useState("");
  const [data, setData] = useState("");
  const [sandbox, setSandbox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);
  const [curlGetCopied, setCurlGetCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [showSandbox, setShowSandbox] = useState(false);
  const didMount = useRef(false);
  const curlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const curlGetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    const stored = localStorage.getItem(DEVICE_ID_LS_KEY);
    if (stored) setDeviceId(stored);

    const params = new URLSearchParams(window.location.search);
    if (params.has("dev")) {
      setShowSandbox(true);
    }
  }, []);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (deviceId) {
      localStorage.setItem(DEVICE_ID_LS_KEY, deviceId);
    } else {
      localStorage.removeItem(DEVICE_ID_LS_KEY);
    }
  }, [deviceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    setResult(null);

    let parsedData: object | undefined;
    if (data.trim()) {
      try {
        parsedData = JSON.parse(data.trim());
      } catch {
        setValidationError("Data field is not valid JSON");
        return;
      }
    }

    const payload: Record<string, unknown> = {
      deviceId: deviceId.trim(),
      title: title.trim(),
      body: body.trim(),
    };
    if (showSandbox || sandbox) payload.sandbox = sandbox;
    if (subtitle.trim()) payload.subtitle = subtitle.trim();
    if (sound.trim()) payload.sound = sound.trim();
    if (badge.trim()) {
      const b = parseInt(badge, 10);
      if (!isNaN(b) && b >= 0) payload.badge = b;
    }
    if (parsedData) payload.data = parsedData;

    setLoading(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setResult({ status: "error", message: json.error ?? "Unknown error" });
        return;
      }

      if (json.ok) {
        setResult({ status: "ok", apnsId: json.apnsId });
      } else {
        setResult({
          status: "error",
          message: json.error ?? `APNs error ${json.statusCode}`,
        });
      }
    } catch {
      setResult({ status: "error", message: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  function buildCurlPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      deviceId: deviceId.trim(),
      title: title.trim(),
      body: body.trim(),
    };
    if (showSandbox || sandbox) payload.sandbox = sandbox;
    if (subtitle.trim()) payload.subtitle = subtitle.trim();
    if (sound.trim()) payload.sound = sound.trim();
    if (badge.trim()) {
      const b = parseInt(badge, 10);
      if (!isNaN(b) && b >= 0) payload.badge = b;
    }
    if (data.trim()) {
      try {
        payload.data = JSON.parse(data.trim());
      } catch {
        // omit invalid data
      }
    }
    return payload;
  }

  function buildCurl(): string {
    const payload = buildCurlPayload();
    return `curl -X POST ${origin}/api/push/send \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload)}'`;
  }

  function buildCurlGet(): string {
    const params = new URLSearchParams();
    params.set("deviceId", deviceId.trim());
    params.set("title", title.trim());
    params.set("body", body.trim());
    if (showSandbox || sandbox) params.set("sandbox", String(sandbox));
    if (subtitle.trim()) params.set("subtitle", subtitle.trim());
    if (sound.trim()) params.set("sound", sound.trim());
    if (badge.trim()) {
      const b = parseInt(badge, 10);
      if (!isNaN(b) && b >= 0) params.set("badge", String(b));
    }
    if (data.trim()) {
      try {
        JSON.parse(data.trim());
        params.set("data", data.trim());
      } catch {
        // omit invalid data
      }
    }
    return `curl "${origin}/api/push/send?${params.toString()}"`;
  }

  const canCopy = !!deviceId.trim() && !!title.trim() && !!body.trim();

  function handleCopyCurl() {
    copyToClipboard(buildCurl()).then(() => {
      setCurlCopied(true);
      if (curlTimeoutRef.current) clearTimeout(curlTimeoutRef.current);
      curlTimeoutRef.current = setTimeout(() => setCurlCopied(false), 1500);
    });
  }

  function handleCopyCurlGet() {
    copyToClipboard(buildCurlGet()).then(() => {
      setCurlGetCopied(true);
      if (curlGetTimeoutRef.current) clearTimeout(curlGetTimeoutRef.current);
      curlGetTimeoutRef.current = setTimeout(() => setCurlGetCopied(false), 1500);
    });
  }

  return (
    <div className={styles.page}>
      <ToolHead
        title="Push Test"
        description="Send a test push notification to a registered mobile device."
        path="/push-test"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/push-test"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Push Test</h1>
        <p className={styles.tagline}>
          Send a test push notification to a registered device.
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Notification</span>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="deviceId">
                  Device ID
                </label>
                <input
                  id="deviceId"
                  className={styles.input}
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  spellCheck={false}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  className={styles.input}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="body">
                  Body
                </label>
                <input
                  id="body"
                  className={styles.input}
                  type="text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Notification body"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="subtitle">
                  Subtitle (optional)
                </label>
                <input
                  id="subtitle"
                  className={styles.input}
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Second line under title"
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="sound">
                    Sound (optional)
                  </label>
                  <input
                    id="sound"
                    className={styles.input}
                    type="text"
                    value={sound}
                    onChange={(e) => setSound(e.target.value)}
                    placeholder="default"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="badge">
                    Badge (optional)
                  </label>
                  <input
                    id="badge"
                    className={styles.input}
                    type="number"
                    min={0}
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="data">
                  Data (JSON, optional)
                </label>
                <textarea
                  id="data"
                  className={styles.textarea}
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder='{ "key": "value" }'
                  spellCheck={false}
                />
              </div>
              <div className={styles.actions}>
                {showSandbox && (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={sandbox}
                      onChange={(e) => setSandbox(e.target.checked)}
                      className={styles.checkbox}
                    />
                    Sandbox
                  </label>
                )}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>

          {validationError && (
            <div className={`${styles.result} ${styles.error}`}>
              {validationError}
            </div>
          )}

          {result && (
            <div
              className={`${styles.result} ${result.status === "ok" ? styles.success : styles.error}`}
            >
              {result.status === "ok"
                ? `Sent — apns-id: ${result.apnsId ?? "n/a"}`
                : `Error: ${result.message}`}
            </div>
          )}

          <div className={styles.panel} style={{ marginTop: 12 }}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>cURL (POST)</span>
              <button
                type="button"
                className={`${styles.curlBtn}${curlCopied ? ` ${styles.copied}` : ""}`}
                disabled={!canCopy}
                onClick={handleCopyCurl}
              >
                {curlCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className={styles.curlCode}>{buildCurl()}</pre>
          </div>

          <div className={styles.panel} style={{ marginTop: 12 }}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>cURL (GET)</span>
              <button
                type="button"
                className={`${styles.curlBtn}${curlGetCopied ? ` ${styles.copied}` : ""}`}
                disabled={!canCopy}
                onClick={handleCopyCurlGet}
              >
                {curlGetCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className={styles.curlCode}>{buildCurlGet()}</pre>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Join TestFlight</span>
            </div>
            <div className={styles.qrPane}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/api/qr?value=https%3A%2F%2Ftestflight.apple.com%2Fjoin%2FEkb1w7yK&dark=%23f0ede8&light=%2313131a"
                alt="TestFlight QR code"
                className={styles.qrImage}
              />
              <p className={styles.qrCaption}>Scan to install the app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
