import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/iframe-proxy.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";

interface RelayedMessage {
  id: string;
  timestamp: number;
  data: any;
  direction: "parent-to-frame" | "frame-to-parent";
}

const PANEL_WIDTH = 320;
const DEBUG_BAR_HEIGHT = 36;

function validateIframeUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Ignore invalid URLs and fall through to return null.
  }
  return null;
}

export default function IframeProxyPage() {
  const branding = useBranding();
  const [url, setUrl] = useState<string | null>(null);
  const [debug, setDebug] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<RelayedMessage[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDebug = params.get("debug") === "true";
    const rawUrl = params.get("url");
    const safeUrl = validateIframeUrl(rawUrl);
    setUrl(safeUrl);
    setDebug(isDebug);
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source === window.parent) {
        iframeRef.current?.contentWindow?.postMessage(event.data, "*");

        if (debug) {
          setMessages((prev) => [
            {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              data: event.data,
              direction: "parent-to-frame",
            },
            ...prev,
          ]);
        }
      } else if (event.source === iframeRef.current?.contentWindow) {
        window.parent.postMessage(event.data, "*");

        if (debug) {
          setMessages((prev) => [
            {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              data: event.data,
              direction: "frame-to-parent",
            },
            ...prev,
          ]);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [debug]);

  if (!mounted) {
    return null;
  }

  if (!url) {
    return (
      <div className={styles.errorState}>
        Missing required <code className={styles.errorCode}>url</code> query
        parameter
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>iframe-proxy — {branding.name}</title>
      </Head>
      {debug && (
        <div className={styles.topBar}>
          <span className={styles.badge}>proxied url</span>
          <span className={styles.urlText}>{url}</span>
          <span className={styles.topBarBrand}>
            {branding.domain} |{" "}
            <Link
              href="/docs/iframe-proxy"
              className={styles.docsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DocIcon className={styles.icon} /> docs
            </Link>
          </span>
          <button
            className={styles.toggleBtn}
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={panelOpen ? "Close debug panel" : "Open debug panel"}
          >
            {panelOpen ? "✕" : "⚙"}
            {!panelOpen && messages.length > 0 && (
              <span className={styles.toggleBadge}>{messages.length}</span>
            )}
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={url}
        className={`${styles.iframe} ${debug ? styles.iframeDebug : ""}`}
      />

      {debug && panelOpen && (
        <div className={styles.backdrop} onClick={() => setPanelOpen(false)} />
      )}

      {debug && (
        <div
          className={`${styles.panel} ${panelOpen ? styles.panelOpen : ""}`}
          style={{ top: DEBUG_BAR_HEIGHT + 12 }}
        >
          <div className={styles.panelHeader}>
            <div className={styles.eyebrow}>
              {branding.domain} |{" "}
              <Link
                href="/docs/iframe-proxy"
                className={styles.docsLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DocIcon className={styles.icon} /> docs
              </Link>
            </div>
            <h1 className={styles.panelTitle}>iframe-proxy</h1>
            <p className={styles.panelTagline}>Relaying iframe messages...</p>
            <span className={styles.messageCount}>
              {messages.length} {messages.length === 1 ? "message" : "messages"}
            </span>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.messageList}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>No messages relayed yet</div>
              ) : (
                messages.map((message, index) => {
                  const isDown = message.direction === "parent-to-frame";
                  return (
                    <div key={message.id} className={styles.messageCard}>
                      <div className={styles.messageCardHeader}>
                        <div className={styles.messageCardMeta}>
                          <div className={styles.messageIndex}>
                            #{messages.length - index}
                          </div>
                          <div
                            className={`${styles.directionBadge} ${isDown ? styles.directionDown : styles.directionUp}`}
                          >
                            {isDown ? "↓ parent→frame" : "↑ frame→parent"}
                          </div>
                        </div>
                        <div className={styles.messageTime}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <div>
                        <div className={styles.dataLabel}>Data</div>
                        <pre className={styles.dataPre}>
                          {JSON.stringify(message.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
