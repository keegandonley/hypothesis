import React, { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../styles/push-test.module.css";

const DEVICE_ID_LS_KEY = "pushTestDeviceId";

type Result =
  | { status: "ok"; id?: string }
  | { status: "error"; message: string };

export default function PushTest() {
  const [deviceId, setDeviceId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const didMount = useRef(false);

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

      const ticket = json.ticket;
      if (ticket?.status === "ok") {
        setResult({ status: "ok", id: ticket.id });
      } else {
        setResult({
          status: "error",
          message: ticket?.message ?? "Expo returned an error",
        });
      }
    } catch {
      setResult({ status: "error", message: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ToolHead
        title="Push Test"
        description="Send a test push notification to a registered mobile device."
        path="/push-test"
      />
      <div className={styles.page}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Hypothesis</p>
          <h1 className={styles.title}>Push Test</h1>
          <p className={styles.tagline}>
            Send a test push notification to a registered device.
          </p>
        </div>
        <hr className={styles.divider} />

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
              ? `Sent — ticket id: ${result.id ?? "n/a"}`
              : `Error: ${result.message}`}
          </div>
        )}
      </div>
    </>
  );
}
