import React, { useEffect, useRef, useState } from "react";
import { PageLayout } from "@/components/ui";
import { useRouter } from "next/router";
import styles from "@/styles/webhook.module.css";
import { Button, CopyButton } from "@/components/ui";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import type { WebhookEvent } from "@/lib/events";
import { formatTimeWithMs } from "@/lib/datetime";

interface Session {
  sessionId: string;
  webhookUrl: string;
  createdAt: string;
  updatedAt: string;
}

function StatusCard({
  variant = "info",
  message,
  action,
}: {
  variant?: "info" | "error";
  message: string;
  action?: { label: string; onClick: () => void };
}): React.ReactNode {
  return (
    <div
      className={`${styles.statusCard} ${variant === "error" ? styles.statusCardError : ""}`}
    >
      <span className={styles.statusCardMessage}>{message}</span>
      {action && (
        <Button variant="copy" onClick={action.onClick}>
          {action.label}
        </Button>
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

export default function WebhookPage(): React.ReactNode {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "deleted" | "idle"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [curlMethod, setCurlMethod] = useState("POST");
  const [sendState, setSendState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const latestReceivedAtRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEventReceivedAtRef = useRef<number>(Date.now());
  const currentSessionIdRef = useRef<string | null>(null);
  const idleRef = useRef<boolean>(false);

  async function fetchEvents(sessionId: string): Promise<void> {
    const cursor = latestReceivedAtRef.current;
    const url = `/api/events/${sessionId}?limit=50${cursor ? `&after=${encodeURIComponent(cursor)}` : ""}`;
    const res = await fetch(url);

    if (!res.ok || sessionId !== currentSessionIdRef.current) return;
    const data = (await res.json()) as { events: WebhookEvent[] };

    if (sessionId !== currentSessionIdRef.current) return;
    if (data.events.length > 0) {
      latestReceivedAtRef.current = data.events[0].receivedAt;
      lastEventReceivedAtRef.current = Date.now();
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newEvents = data.events.filter((e) => !existingIds.has(e.id));

        return newEvents.length > 0 ? [...newEvents, ...prev] : prev;
      });
    }
  }

  // Restart the event poller (2.5s) and heartbeat (60s) for a session.
  // Kept in one place so the visibility handler can pause/resume them.
  function startLoops(sessionId: string): void {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    intervalRef.current = setInterval(() => {
      void fetchEvents(sessionId);
    }, 2500);
    heartbeatRef.current = setInterval(() => {
      void fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    }, 60_000);
  }

  // Stop the polling + heartbeat loops without tearing down the session.
  // Used when the tab is hidden or the session goes idle so we stop billing
  // for background activity nobody is watching.
  function stopLoops(): void {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    intervalRef.current = null;
    heartbeatRef.current = null;
  }

  function startSession(
    sessionId?: string,
    {
      skipLocalStorage = false,
      fromLocalStorage = false,
    }: { skipLocalStorage?: boolean; fromLocalStorage?: boolean } = {},
  ): void {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    if (!sessionId && !skipLocalStorage)
      localStorage.removeItem("webhookSessionId");
    currentSessionIdRef.current = null;
    latestReceivedAtRef.current = null;
    lastEventReceivedAtRef.current = Date.now();
    idleRef.current = false;
    setStatus("loading");
    setErrorMessage(null);
    setEvents([]);
    setSelectedEvent(null);

    void fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: sessionId ? JSON.stringify({ sessionId }) : "{}",
    })
      .then(async (r) => {
        const data = (await r.json()) as Session & { error?: string };

        if (r.status === 429) {
          setErrorMessage(data.error ?? "rate limit exceeded");
          setStatus("ready");

          return;
        }

        if (r.status === 404) {
          if (fromLocalStorage) {
            localStorage.removeItem("webhookSessionId");
            startSession();

            return;
          }

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
      .then((data: (Session & { error?: string }) | undefined) => {
        if (!data) return;
        currentSessionIdRef.current = data.sessionId;
        if (!skipLocalStorage) {
          localStorage.setItem("webhookSessionId", data.sessionId);
          void router.replace({ query: { s: data.sessionId } }, undefined, {
            shallow: true,
          });
        }

        setSession(data);
        setStatus("ready");
        void fetchEvents(data.sessionId);
        // Don't start background loops if the tab is already hidden — the
        // visibility handler will start them when the tab is focused.
        if (!document.hidden) startLoops(data.sessionId);
        // Guard against a leaked interval if two startSession calls race
        // (e.g. rapid "New session" clicks) — an orphaned idle check could
        // otherwise force a live session idle and stop its heartbeat.
        if (idleCheckRef.current) clearInterval(idleCheckRef.current);
        idleCheckRef.current = setInterval(() => {
          if (Date.now() - lastEventReceivedAtRef.current > 30 * 60 * 1000) {
            // Idle: stop polling AND the heartbeat (previously the heartbeat
            // kept firing for the entire tab lifetime — days/weeks — billing
            // compute for a session nobody was watching).
            idleRef.current = true;
            stopLoops();
            if (idleCheckRef.current) clearInterval(idleCheckRef.current);
            idleCheckRef.current = null;
            setStatus("idle");
          }
        }, 60_000);
      })
      .catch(() => {
        setStatus("error");
      });
  }

  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get("s");
    const stored = localStorage.getItem("webhookSessionId") ?? undefined;

    if (urlParam) {
      startSession(urlParam, {
        skipLocalStorage: urlParam !== stored,
        fromLocalStorage: !!stored && urlParam === stored,
      });
    } else {
      startSession(stored, { fromLocalStorage: !!stored });
    }

    // Pause polling + heartbeat while the tab is hidden, resume on focus.
    // A backgrounded webhook tab generated invocations indefinitely; this
    // ties background activity to whether anyone is actually looking.
    const handleVisibility = (): void => {
      const sessionId = currentSessionIdRef.current;

      if (!sessionId) return;

      if (document.hidden) {
        stopLoops();
      } else if (!idleRef.current) {
        // Catch up on anything missed while hidden, then resume the loops.
        void fetchEvents(sessionId);
        startLoops(sessionId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildCurlCommand(method: string, url: string): string {
    const hasBody = ["POST", "PUT", "PATCH"].includes(method.toUpperCase());

    if (hasBody) {
      return `curl -X ${method.toUpperCase()} ${url} \\\n  -H "Content-Type: application/json" \\\n  -d '{"hello":"world"}'`;
    }

    return `curl -X ${method.toUpperCase()} ${url}`;
  }

  const handleSendRequest = (): void => {
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
      .then((r) => {
        setSendState(r.ok ? "sent" : "error");
      })
      .catch(() => {
        setSendState("error");
      })
      .finally(() =>
        setTimeout(() => {
          setSendState("idle");
        }, 2000),
      );
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Webhook Inspector"
        metaDescription="Receive and inspect incoming HTTP webhook requests in real time. Free online webhook testing tool."
        path="/webhook"
        tagline="Capture and inspect incoming HTTP webhook requests in real time. Remain on this page to keep your session active. Expired sessions will be deleted within 24 hours."
      >

      {status === "loading" && <StatusCard message="initializing..." />}

      {status === "error" && (
        <StatusCard variant="error" message="failed to initialize session" />
      )}

      {status === "deleted" && (
        <StatusCard
          variant="error"
          message="session has expired"
          action={{
            label: "Generate new session",
            onClick: () => {
              startSession();
            },
          }}
        />
      )}

      {status === "ready" && !session && errorMessage && (
        <StatusCard variant="error" message={errorMessage} />
      )}

      {(status === "ready" || status === "idle") && session && (
        <>
          <div className={styles.panels}>
            <Panel>
              <PanelHeader label="Webhook URL">
                <Button variant="copy" onClick={() => { startSession(); }}>
                  New session
                </Button>
                <CopyButton value={session.webhookUrl} />
              </PanelHeader>
              <div className={styles.urlDisplay}>{session.webhookUrl}</div>
              {errorMessage && (
                <div className={styles.errorText}>{errorMessage}</div>
              )}
            </Panel>

            <Panel>
              <div className={styles.curlPanelHeader}>
                <span className={styles.panelLabel}>curl</span>
                <div className={styles.methodToggles}>
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                    <Button
                      key={m}
                      variant="tab"
                      active={curlMethod === m}
                      style={
                        curlMethod === m
                          ? ({
                              "--method-color": methodColor(m),
                            } as React.CSSProperties)
                          : undefined
                      }
                      onClick={() => {
                        setCurlMethod(m);
                      }}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
              <div className={styles.curlPanelBody}>
                <pre className={styles.curlCode}>
                  {buildCurlCommand(curlMethod, session.webhookUrl)}
                </pre>
                <CopyButton value={buildCurlCommand(curlMethod, session.webhookUrl)} variant="ghost" />
                <Button
                  variant="copy"
                  status={sendState === "sending" ? "pending" : sendState === "sent" ? "success" : sendState === "error" ? "error" : "idle"}
                  onClick={handleSendRequest}
                  disabled={sendState === "sending"}
                >
                  Send request
                </Button>
              </div>
            </Panel>
          </div>

          <div className={styles.eventsPanel}>
            <PanelHeader label="Requests" />
            <div className={styles.eventsList}>
              {events.length === 0 ? (
                <div className={styles.emptyState}>waiting for requests...</div>
              ) : (
                events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className={`${styles.eventRow}${selectedEvent?.id === event.id ? ` ${styles.selected}` : ""}`}
                    aria-expanded={selectedEvent?.id === event.id}
                    aria-controls={
                      selectedEvent?.id === event.id
                        ? "webhook-event-detail"
                        : undefined
                    }
                    onClick={() => {
                      setSelectedEvent(
                        selectedEvent?.id === event.id ? null : event,
                      );
                    }}
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
                    <span
                      className={styles.eventTime}
                      title={formatTimeWithMs(new Date(event.receivedAt))}
                    >
                      {relativeTime(event.receivedAt)}
                    </span>
                  </button>
                ))
              )}
            </div>
            {selectedEvent && (
              <div id="webhook-event-detail" className={styles.eventDetail}>
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
          {status === "idle" && (
            <div className={styles.idleOverlay}>
              <div className={styles.idleDialog}>
                <span className={styles.idleTitle}>session idle</span>
                <p className={styles.idleBody}>
                  No requests received in 30 minutes. Your session is paused.
                </p>
                <Button
                  variant="copy"
                  onClick={() => {
                    startSession(session.sessionId);
                  }}
                >
                  Re-activate session
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <div className={styles.appNotice}>
        <span className={styles.appNoticeText}>
          For long-lived webhook sessions with push notifications, try the new
          free mobile app!
        </span>
        <a
          href="https://apps.apple.com/us/app/hypothesis-sh/id6764898246"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://static.donley.xyz/appstore-white.svg"
            alt="Download on the App Store"
            className={styles.appStoreBadge}
          />
        </a>
      </div>
      </PageLayout>
    </div>
  );
}
