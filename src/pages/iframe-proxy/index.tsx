import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "@/styles/iframe-proxy.module.css";
import { DocIcon } from "@/components/icons/doc";
import { LogIcon } from "@/components/icons/log";
import { useBranding } from "@/lib/branding";
import { Badge, Button, CopyButton } from "@/components/ui";
import { ToolHead } from "@/components/ToolHead";
import { useIsIframe } from "@/lib/useIsIframe";
import { useUrlSync } from "@/lib/useUrlSync";
import { formatTimeWithMs } from "@/lib/datetime";

interface RelayedMessage {
  id: string;
  timestamp: number;
  data: unknown;
  direction: "parent-to-frame" | "frame-to-parent";
}

const DEBUG_BAR_HEIGHT = 36;
// Long frame-proxy debugging sessions can relay thousands of messages; keep
// the debug feed bounded so re-renders and memory stay flat.
const MAX_MESSAGES = 500;

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

export default function IframeProxyPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const { replaceUrlNow } = useUrlSync();
  const [url, setUrl] = useState<string | null>(null);
  const [debug, setDebug] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<RelayedMessage[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [urlFromParam, setUrlFromParam] = useState(false);
  const [frameName, setFrameName] = useState("");
  const [frameNameDraft, setFrameNameDraft] = useState("");
  const [inWorkMode, setInWorkMode] = useState(false);
  // While paused, relayed messages keep collecting into state (relaying is
  // never interrupted) but the log renders from this frozen snapshot.
  const [pausedSnapshot, setPausedSnapshot] = useState<RelayedMessage[] | null>(
    null,
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const paused = pausedSnapshot !== null;
  const visibleMessages = pausedSnapshot ?? messages;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDebug = params.get("debug") === "true";
    const rawUrl = params.get("url");
    const safeUrl = validateIframeUrl(rawUrl);

    setUrl(safeUrl); // eslint-disable-line react-hooks/set-state-in-effect
    if (safeUrl) {
      setUrlFromParam(true);
      setInputUrl(safeUrl);
    }

    const initialName = params.get("name") ?? "";

    setFrameName(initialName);
    setFrameNameDraft(initialName);
    setDebug(isDebug);
    setInWorkMode(params.has("workMode"));
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent): void => {
      if (event.source === window.parent) {
        iframeRef.current?.contentWindow?.postMessage(event.data, "*");

        if (debug) {
          setMessages((prev) =>
            [
              {
                id: `${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                data: event.data as unknown,
                direction: "parent-to-frame" as const,
              },
              ...prev,
            ].slice(0, MAX_MESSAGES),
          );
        }
      } else if (event.source === iframeRef.current?.contentWindow) {
        window.parent.postMessage(event.data, "*");

        if (debug) {
          setMessages((prev) =>
            [
              {
                id: `${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
                data: event.data as unknown,
                direction: "frame-to-parent" as const,
              },
              ...prev,
            ].slice(0, MAX_MESSAGES),
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [debug]);

  useEffect(() => {
    if (!mounted) return;

    const params = new URLSearchParams(window.location.search);

    if (frameName) {
      params.set("name", frameName);
    } else {
      params.delete("name");
    }

    // frameName only changes on submit/blur (drafts live in frameNameDraft),
    // so an immediate write is safe and correct here.
    replaceUrlNow(`${window.location.pathname}?${params.toString()}`);
  }, [frameName, mounted, replaceUrlNow]);

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

  const handleUrlSubmit = (raw: string): void => {
    const validated = validateIframeUrl(raw);

    if (!validated) return;
    setUrl(validated);
    setUrlFromParam(true);
    const params = new URLSearchParams(window.location.search);

    params.set("url", validated);
    replaceUrlNow(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <>
    <ToolHead
      title="Iframe Proxy"
      description="Embed any URL in a sandboxed iframe with configurable postMessage communication. Free online iframe proxy tool."
      path="/iframe-proxy"
    />
      {inWorkMode && !debug && (
        <div className={styles.workBar}>
          <Badge>proxied url</Badge>
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
              onChange={(e) => {
                setInputUrl(e.target.value);
              }}
              autoFocus={!url}
              spellCheck={false}
            />
          </form>
        </div>
      )}
      {inWorkMode && !debug && !url && (
        <div className={styles.workPlaceholder}>enter a url above to begin</div>
      )}

      {debug && (
        <div className={styles.topBar}>
          <Badge>proxied url</Badge>
          {urlFromParam ? (
            <span className={styles.urlText} title={url ?? undefined}>
              {url}
            </span>
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
                onChange={(e) => {
                  setInputUrl(e.target.value);
                }}
                autoFocus
              />
            </form>
          )}
          <span className={styles.topBarBrand} data-eyebrow>
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
            onClick={() => {
              setPanelOpen((o) => !o);
            }}
            aria-label={panelOpen ? "Close debug panel" : "Open debug panel"}
          >
            {panelOpen ? (
              <span className={styles.toggleClose}>✕</span>
            ) : (
              <LogIcon className={styles.toggleIcon} />
            )}
            {!panelOpen && messages.length > 0 && (
              <span className={styles.toggleBadge}>{messages.length}</span>
            )}
          </button>
        </div>
      )}

      {url && (
        <iframe
          key={frameName}
          ref={iframeRef}
          src={url}
          name={frameName || undefined}
          className={`${styles.iframe} ${debug ? styles.iframeDebug : ""} ${inWorkMode && !debug ? styles.iframeWork : ""}`}
        />
      )}

      {debug && panelOpen && (
        <div
          className={styles.backdrop}
          onClick={() => {
            setPanelOpen(false);
          }}
        />
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
              <label
                className={styles.frameNameLabel}
                htmlFor="proxy-frame-name"
              >
                frame name
              </label>
              <form
                className={styles.frameNameForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  setFrameName(frameNameDraft);
                }}
              >
                <input
                  id="proxy-frame-name"
                  className={styles.frameNameInput}
                  type="text"
                  placeholder="(none)"
                  value={frameNameDraft}
                  onChange={(e) => {
                    setFrameNameDraft(e.target.value);
                  }}
                  onBlur={() => {
                    setFrameName(frameNameDraft);
                  }}
                  spellCheck={false}
                />
              </form>
            </div>
            <span className={styles.messageCount}>
              {messages.length} {messages.length === 1 ? "message" : "messages"}
            </span>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.listHeader}>
              <span className={styles.listMeta}>
                Newest first
                {messages.length >= MAX_MESSAGES &&
                  ` · showing latest ${MAX_MESSAGES}`}
                {paused &&
                  ` · paused (${messages.length - visibleMessages.length} new)`}
              </span>
              <div className={styles.listControls}>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setPausedSnapshot(paused ? null : messages);
                  }}
                >
                  {paused ? "Resume" : "Pause"}
                </Button>
                <Button
                  variant="reset"
                  size="xs"
                  onClick={() => {
                    setMessages([]);
                    // Clearing implies "start fresh", so also resume live.
                    setPausedSnapshot(null);
                  }}
                  disabled={messages.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className={styles.messageList}>
              {visibleMessages.length === 0 ? (
                <div className={styles.emptyState}>No messages relayed yet</div>
              ) : (
                visibleMessages.map((message, index) => {
                  const isDown = message.direction === "parent-to-frame";

                  return (
                    <div key={message.id} className={styles.messageCard}>
                      <div className={styles.messageCardHeader}>
                        <div className={styles.messageCardMeta}>
                          <div className={styles.messageIndex}>
                            #{visibleMessages.length - index}
                          </div>
                          <div
                            className={`${styles.directionBadge} ${isDown ? styles.directionDown : styles.directionUp}`}
                          >
                            {isDown ? "↓ parent → frame" : "↑ frame → parent"}
                          </div>
                        </div>
                        <div className={styles.messageHeaderRight}>
                          <div className={styles.messageTime}>
                            {formatTimeWithMs(new Date(message.timestamp))}
                          </div>
                          <CopyButton
                            value={JSON.stringify(message.data, null, 2)}
                            variant="ghost"
                            size="xs"
                          />
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
