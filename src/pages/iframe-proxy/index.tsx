import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/iframe-proxy.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";

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
  const isIframe = useIsIframe();
  const [url, setUrl] = useState<string | null>(null);
  const [debug, setDebug] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<RelayedMessage[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [urlFromParam, setUrlFromParam] = useState(false);
  const [frameName, setFrameName] = useState("");
  const [inWorkMode, setInWorkMode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDebug = params.get("debug") === "true";
    const rawUrl = params.get("url");
    const safeUrl = validateIframeUrl(rawUrl);
    setUrl(safeUrl);
    if (safeUrl) {
      setUrlFromParam(true);
      setInputUrl(safeUrl);
    }
    setFrameName(params.get("name") ?? "");
    setDebug(isDebug);
    setInWorkMode(params.has("workMode"));
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

  if (!url && !debug && !inWorkMode) {
    return (
      <div className={styles.errorState}>
        Missing required <code className={styles.errorCode}>url</code> query
        parameter
      </div>
    );
  }

  const handleUrlSubmit = (raw: string) => {
    const validated = validateIframeUrl(raw);
    if (!validated) return;
    setUrl(validated);
    setUrlFromParam(true);
    const params = new URLSearchParams(window.location.search);
    params.set("url", validated);
    history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <>
      <Head>
        <title>{`${branding.name.toUpperCase()} — IFRAME PROXY`}</title>
      </Head>
      {inWorkMode && (
        <div className={styles.workBar}>
          <span className={styles.badge}>proxied url</span>
          <form
            className={styles.urlInlineForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleUrlSubmit(inputUrl);
            }}
          >
            <input
              className={styles.urlInlineInput}
              type="url"
              placeholder="https://example.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              autoFocus={!url}
              spellCheck={false}
            />
          </form>
        </div>
      )}
      {inWorkMode && !url && (
        <div className={styles.workPlaceholder}>enter a url above to begin</div>
      )}

      {debug && (
        <div className={styles.topBar}>
          <span className={styles.badge}>proxied url</span>
          {urlFromParam ? (
            <span className={styles.urlText}>{url}</span>
          ) : (
            <form
              className={styles.urlInlineForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleUrlSubmit(inputUrl);
              }}
            >
              <input
                className={styles.urlInlineInput}
                type="url"
                placeholder="https://example.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                autoFocus
              />
            </form>
          )}
          <span className={styles.topBarBrand}>
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

      {url && (
        <iframe
          ref={iframeRef}
          src={url}
          name={frameName || undefined}
          className={`${styles.iframe} ${debug ? styles.iframeDebug : ""} ${inWorkMode && !debug ? styles.iframeWork : ""}`}
        />
      )}

      {debug && panelOpen && (
        <div className={styles.backdrop} onClick={() => setPanelOpen(false)} />
      )}

      {debug && (
        <div
          className={`${styles.panel} ${panelOpen ? styles.panelOpen : ""}`}
          style={{ top: DEBUG_BAR_HEIGHT + 12 }}
        >
          <div className={styles.panelHeader}>
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
                href="/docs/iframe-proxy"
                className={styles.docsLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DocIcon className={styles.icon} /> docs
              </Link>
            </div>
            <h1 className={styles.panelTitle}>iframe proxy</h1>
            <p className={styles.panelTagline}>Relaying iframe messages...</p>
            <div className={styles.frameNameRow}>
              <label className={styles.frameNameLabel}>frame name</label>
              <input
                className={styles.frameNameInput}
                type="text"
                placeholder="(none)"
                value={frameName}
                onChange={(e) => setFrameName(e.target.value)}
                spellCheck={false}
              />
            </div>
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
                            {isDown ? "↓ parent → frame" : "↑ frame → parent"}
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
