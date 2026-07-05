import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "@/styles/message-factory-viewer.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { ToolHead } from "@/components/ToolHead";
import { PermalinkRow, CopyButton } from "@/components/ui";

interface Action {
  id: string;
  name: string;
  payload: Record<string, unknown>;
}

function decodeActions(raw: string): Action[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const parsed = JSON.parse(decodeURIComponent(escape(atob(raw)))) as Record<
      string,
      unknown
    >[];

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      name: typeof item.name === "string" ? item.name : "",
      payload:
        item.payload !== null && typeof item.payload === "object"
          ? (item.payload as Record<string, unknown>)
          : {},
    }));
  } catch {
    return [];
  }
}

export default function ViewerPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [actions, setActions] = useState<Action[]>([]);
  const [url, setUrl] = useState("");
  const [designerUrl, setDesignerUrl] = useState("");
  const [sentKeys, setSentKeys] = useState<Record<number, boolean>>({});
  const [debug, setDebug] = useState(false);
  const sentTimeoutRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {},
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setDebug(params.get("debug") === "true"); // eslint-disable-line react-hooks/set-state-in-effect
    const raw = params.get("actions");

    if (raw) {
      setActions(decodeActions(raw));
      setDesignerUrl(
        `${window.location.origin}/message-factory/designer?actions=${raw}`,
      );
    } else {
      setDesignerUrl(`${window.location.origin}/message-factory/designer`);
    }

    setUrl(window.location.href);
  }, []);

  const handleSend = (action: Action, idx: number): void => {
    window.parent.postMessage({ id: action.id, payload: action.payload }, "*");
    setSentKeys((prev) => ({ ...prev, [idx]: true }));
    if (sentTimeoutRefs.current[idx])
      clearTimeout(sentTimeoutRefs.current[idx]);
    sentTimeoutRefs.current[idx] = setTimeout(() => {
      setSentKeys((prev) => ({ ...prev, [idx]: false }));
    }, 1500);
  };

  const handleReset = (): void => {
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
    setActions([]);
    setDesignerUrl(`${window.location.origin}/message-factory/designer`);
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="Message Viewer"
        description="Trigger postMessage actions to a parent frame from a configurable button panel, for testing message-driven pages."
        path="/message-factory/viewer"
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
            href="/docs/message-factory"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Message Viewer</h1>
        <p className={styles.tagline}>
          Click a button to trigger a postMessage to the parent frame.
        </p>
      </div>

      <hr className={styles.divider} />

      {/* Action buttons */}
      <div className={styles.buttonGrid}>
        {actions.length === 0 ? (
          <div className={styles.emptyState}>
            No actions loaded. Use the designer to create actions and open this
            viewer with a{" "}
            <a href={designerUrl} className={styles.inlineLink}>
              ?actions=
            </a>{" "}
            parameter.
          </div>
        ) : (
          actions.map((action, idx) => (
            <button
              key={idx}
              className={`${styles.actionBtn}${sentKeys[idx] ? ` ${styles.sent}` : ""}`}
              onClick={() => {
                handleSend(action, idx);
              }}
            >
              {action.name || action.id || `action ${idx + 1}`}
              <span className={styles.sentOverlay}>sent ✓</span>
            </button>
          ))
        )}
      </div>

      {debug && (
        <>
          <hr className={styles.divider} />

          <PermalinkRow url={url} onReset={handleReset} />

          {/* Open Designer link */}
          <div className={styles.designerRow}>
            <a href={designerUrl} className={styles.designerLink}>
              Open Designer →
            </a>
          </div>
        </>
      )}
    </div>
  );
}
