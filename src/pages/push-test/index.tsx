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
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);
  const didMount = useRef(false);
  const curlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(DEVICE_ID_LS_KEY);
    if (stored) setDeviceId(stored);
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

    setLoading(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: deviceId.trim(),
          title: title.trim(),
          body: body.trim(),
          ...(parsedData ? { data: parsedData } : {}),
        }),
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

  function buildCurl(): string {
    const payload: Record<string, unknown> = {
      deviceId: deviceId.trim(),
      title: title.trim(),
      body: body.trim(),
    };
    if (data.trim()) {
      try {
        payload.data = JSON.parse(data.trim());
      } catch {
        // omit invalid data
      }
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "https://hypothesis.sh";
    return `curl -X POST ${origin}/api/push/send \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(payload)}'`;
  }

  function handleCopyCurl() {
    copyToClipboard(buildCurl()).then(() => {
      setCurlCopied(true);
      if (curlTimeoutRef.current) clearTimeout(curlTimeoutRef.current);
      curlTimeoutRef.current = setTimeout(() => setCurlCopied(false), 1500);
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
          <span className={styles.panelLabel}>cURL</span>
          <button
            type="button"
            className={`${styles.curlBtn}${curlCopied ? ` ${styles.copied}` : ""}`}
            disabled={!deviceId.trim() || !title.trim() || !body.trim()}
            onClick={handleCopyCurl}
          >
            {curlCopied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className={styles.curlCode}>{buildCurl()}</pre>
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
