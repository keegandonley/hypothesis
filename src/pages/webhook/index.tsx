import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../styles/webhook.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import type { WebhookEvent } from "@/lib/events";

type Session = {
  sessionId: string;
  webhookUrl: string;
  createdAt: string;
  updatedAt: string;
};

function StatusCard({
  variant = "info",
  message,
  action,
}: {
  variant?: "info" | "error";
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className={`${styles.statusCard} ${variant === "error" ? styles.statusCardError : ""}`}>
      <span className={styles.statusCardMessage}>{message}</span>
      {action && (
        <button className={styles.statusCardAction} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "var(--accent)";
    case "POST":
      return "#22c55e";
    case "PUT":
      return "#f97316";
    case "PATCH":
      return "#eab308";
    case "DELETE":
      return "#ef4444";
    default:
      return "var(--muted)";
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function WebhookPage() {
  const router = useRouter();
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "deleted">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [curlMethod, setCurlMethod] = useState("POST");
  const [curlCopied, setCurlCopied] = useState(false);
  const [sendState, setSendState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const curlCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestReceivedAtRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  async function fetchEvents(sessionId: string) {
    const cursor = latestReceivedAtRef.current;
    const url = `/api/events/${sessionId}?limit=50${cursor ? `&after=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok || sessionId !== currentSessionIdRef.current) return;
    const data = await res.json();
    if (sessionId !== currentSessionIdRef.current) return;
    if (data.events.length > 0) {
      latestReceivedAtRef.current = data.events[0].receivedAt;
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newEvents = data.events.filter(
          (e: WebhookEvent) => !existingIds.has(e.id),
        );
        return newEvents.length > 0 ? [...newEvents, ...prev] : prev;
      });
    }
  }

  function startSession(
    sessionId?: string,
    { skipLocalStorage = false }: { skipLocalStorage?: boolean } = {},
  ) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (!sessionId && !skipLocalStorage)
      localStorage.removeItem("webhookSessionId");
    currentSessionIdRef.current = null;
    latestReceivedAtRef.current = null;
    setStatus("loading");
    setErrorMessage(null);
    setEvents([]);
    setSelectedEvent(null);

    fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: sessionId ? JSON.stringify({ sessionId }) : "{}",
    })
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 429) {
          setErrorMessage(data.error ?? "rate limit exceeded");
          setStatus("ready");
          return;
        }
        if (r.status === 404) {
          setStatus("deleted");
          return;
        }
        if (!r.ok) {
          setErrorMessage(data.error ?? "unknown error");
          setStatus("error");
          return;
        }
        return data;
      })
      .then((data) => {
        if (!data) return;
        currentSessionIdRef.current = data.sessionId;
        if (!skipLocalStorage) {
          localStorage.setItem("webhookSessionId", data.sessionId);
          router.replace({ query: { s: data.sessionId } }, undefined, {
            shallow: true,
          });
        }
        setSession(data);
        setStatus("ready");
        fetchEvents(data.sessionId);
        intervalRef.current = setInterval(
          () => fetchEvents(data.sessionId),
          2500,
        );
        heartbeatRef.current = setInterval(() => {
          fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: data.sessionId }),
          });
        }, 60_000);
      })
      .catch(() => setStatus("error"));
  }

  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get("s");
    if (urlParam) {
      startSession(urlParam, { skipLocalStorage: true });
    } else {
      const stored = localStorage.getItem("webhookSessionId") ?? undefined;
      startSession(stored);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  function buildCurlCommand(method: string, url: string): string {
    const hasBody = ["POST", "PUT", "PATCH"].includes(method.toUpperCase());
    if (hasBody) {
      return `curl -X ${method.toUpperCase()} ${url} \\\n  -H "Content-Type: application/json" \\\n  -d '{"hello":"world"}'`;
    }
    return `curl -X ${method.toUpperCase()} ${url}`;
  }

  const handleSendRequest = () => {
    if (!session || sendState === "sending") return;
    setSendState("sending");
    const hasBody = ["POST", "PUT", "PATCH"].includes(curlMethod.toUpperCase());
    fetch(session.webhookUrl, {
      method: curlMethod,
      credentials: "omit",
      ...(hasBody
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hello: "world" }),
          }
        : {}),
    })
      .then((r) => setSendState(r.ok ? "sent" : "error"))
      .catch(() => setSendState("error"))
      .finally(() => setTimeout(() => setSendState("idle"), 2000));
  };

  const handleCurlCopy = () => {
    const url = session?.webhookUrl ?? "";
    copyToClipboard(buildCurlCommand(curlMethod, url)).then(() => {
      setCurlCopied(true);
      if (curlCopyTimeoutRef.current) clearTimeout(curlCopyTimeoutRef.current);
      curlCopyTimeoutRef.current = setTimeout(() => setCurlCopied(false), 1500);
    });
  };

  const handleCopy = () => {
    if (!session) return;
    copyToClipboard(session.webhookUrl).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name.toUpperCase()} — WEBHOOK</title>
      </Head>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
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
            href="/docs/webhook"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>webhook</h1>
        <p className={styles.tagline}>
          Capture and inspect incoming HTTP webhook requests in real time.
          <br />
          <br />
          Remain on this page to keep your session active. Expired sessions will
          be deleted within 24 hours.
        </p>
      </div>

      <hr className={styles.divider} />

      {status === "loading" && <StatusCard message="initializing..." />}

      {status === "error" && (
        <StatusCard variant="error" message="failed to initialize session" />
      )}

      {status === "deleted" && (
        <StatusCard
          variant="error"
          message="session has been deleted"
          action={{ label: "Generate new session", onClick: () => startSession() }}
        />
      )}

      {status === "ready" && !session && errorMessage && (
        <StatusCard variant="error" message={errorMessage} />
      )}

      {status === "ready" && session && (
        <>
          <div className={styles.panels}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelLabel}>Webhook URL</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className={styles.copyBtn}
                    onClick={() => startSession()}
                  >
                    New session
                  </button>
                  <button
                    className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
                    onClick={handleCopy}
                  >
                    {copied ? "Copied!" : "Copy Webhook URL"}
                  </button>
                </div>
              </div>
              <div className={styles.urlDisplay}>{session.webhookUrl}</div>
              {errorMessage && (
                <div className={styles.errorText}>{errorMessage}</div>
              )}
            </div>

            <div className={styles.panel}>
              <div className={styles.curlPanelHeader}>
                <span className={styles.panelLabel}>curl</span>
                <div className={styles.methodToggles}>
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                    <button
                      key={m}
                      className={`${styles.methodToggle}${curlMethod === m ? ` ${styles.active}` : ""}`}
                      style={
                        curlMethod === m
                          ? ({
                              "--method-color": methodColor(m),
                            } as React.CSSProperties)
                          : undefined
                      }
                      onClick={() => setCurlMethod(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.curlPanelBody}>
                <pre className={styles.curlCode}>
                  {buildCurlCommand(curlMethod, session.webhookUrl)}
                </pre>
                <button
                  className={`${styles.copyBtn}${curlCopied ? ` ${styles.copied}` : ""}`}
                  onClick={handleCurlCopy}
                >
                  {curlCopied ? "Copied!" : "Copy"}
                </button>
                <button
                  className={`${styles.copyBtn}${sendState === "sent" ? ` ${styles.copied}` : ""}`}
                  onClick={handleSendRequest}
                  disabled={sendState === "sending"}
                >
                  {sendState === "sending"
                    ? "Sending..."
                    : sendState === "sent"
                      ? "Sent!"
                      : sendState === "error"
                        ? "Error"
                        : "Send request"}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.eventsPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Requests</span>
            </div>
            <div className={styles.eventsList}>
              {events.length === 0 ? (
                <div className={styles.emptyState}>waiting for requests...</div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className={`${styles.eventRow}${selectedEvent?.id === event.id ? ` ${styles.selected}` : ""}`}
                    onClick={() =>
                      setSelectedEvent(
                        selectedEvent?.id === event.id ? null : event,
                      )
                    }
                  >
                    <span
                      className={styles.methodBadge}
                      style={{ color: methodColor(event.method) }}
                    >
                      {event.method.toUpperCase()}
                    </span>
                    <span className={styles.eventMeta}>
                      {event.headers["content-type"] ?? ""}
                    </span>
                    <span className={styles.eventTime}>
                      {relativeTime(event.receivedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
            {selectedEvent && (
              <div className={styles.eventDetail}>
                {["authorization", "cookie", "x-api-key"].some(
                  (h) => h in selectedEvent.headers,
                ) && (
                  <div className={styles.sensitiveWarning}>
                    Warning: this request contains sensitive headers (e.g.
                    Authorization, Cookie). Do not share this session URL.
                  </div>
                )}
                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>Headers</div>
                  <pre className={styles.detailCode}>
                    {JSON.stringify(selectedEvent.headers, null, 2)}
                  </pre>
                </div>
                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>Body</div>
                  <pre className={styles.detailCode}>
                    {selectedEvent.payload !== null
                      ? JSON.stringify(selectedEvent.payload, null, 2)
                      : (selectedEvent.rawBody ?? "(empty)")}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
