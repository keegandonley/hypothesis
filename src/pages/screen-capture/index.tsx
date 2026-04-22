import { useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/screen-capture.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { captureTab } from "@keegancodes/capture-screen";

type Status = "idle" | "capturing" | "cancelled" | "error";

const FRAME_DOMAINS = ["hypothesis.sh", "conclusion.sh", "observation.sh"];

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

export default function ScreenCapturePage() {
  const branding = useBranding();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const altDomains = FRAME_DOMAINS.filter((d) => d !== branding.domain).slice(0, 2);

  async function handleCapture() {
    setStatus("capturing");
    setErrorMsg("");
    try {
      const blob = await captureTab({ mimeType: "image/png" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setStatus("idle");
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("cancelled");
      } else {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    }
  }

  return (
    <div className={styles.page}>
      <ToolHead
        title="screen capture"
        description="Capture the current browser tab as a PNG and open it in a new tab."
        path="/screen-capture"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/screen-capture"
            style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3em" }}
          >
            <DocIcon /> docs
          </Link>
        </div>
        <h1 className={styles.title}>screen capture</h1>
        <p className={styles.tagline}>
          Capture the current browser tab as a PNG and open it in a new tab.
        </p>
      </div>

      <div className={styles.captureRow}>
        <button
          className={styles.captureBtn}
          onClick={handleCapture}
          disabled={status === "capturing"}
        >
          {status === "capturing" ? "capturing…" : "capture this tab"}
        </button>
        {status === "cancelled" && (
          <span className={styles.statusMsg}>capture cancelled</span>
        )}
        {status === "error" && (
          <span className={`${styles.statusMsg} ${styles.error}`}>
            {errorMsg || "capture failed"}
          </span>
        )}
      </div>

      <p className={styles.lorem}>{LOREM}</p>

      <div className={styles.frames}>
        {altDomains.map((domain) => (
          <div key={domain} className={styles.frame}>
            <iframe
              src={`https://${domain}`}
              className={styles.frameEl}
              title={domain}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ))}
      </div>

      <div className={styles.rainbow} />
    </div>
  );
}
