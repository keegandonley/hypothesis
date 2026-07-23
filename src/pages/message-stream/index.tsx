import { useEffect, useState } from "react";
import { Badge, Button, CopyButton, PageLayout } from "@/components/ui";
import styles from "@/styles/message-stream.module.css";
import { useBranding } from "@/lib/branding";
import { formatTimeWithMs } from "@/lib/datetime";

interface Message {
  id: string;
  timestamp: number;
  data: unknown;
  origin: string;
  direction: "sent" | "received";
}

// Long debugging sessions can receive thousands of messages; keep the feed
// bounded so re-renders and memory stay flat.
const MAX_MESSAGES = 500;

export default function MessagesPage(): React.ReactNode {
  const branding = useBranding();
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<Record<string, unknown> | null>(null);
  // A malformed ?context= param used to fail silently (console only); this
  // drives a visible notice so the sender knows their payload was dropped.
  const [contextDecodeFailed, setContextDecodeFailed] = useState(false);
  const [sendInput, setSendInput] = useState("");
  // While paused, messages keep collecting into state (nothing is dropped)
  // but the list renders from this frozen snapshot so the card being
  // inspected doesn't get pushed down mid-read.
  const [pausedSnapshot, setPausedSnapshot] = useState<Message[] | null>(null);

  const paused = pausedSnapshot !== null;
  const visibleMessages = pausedSnapshot ?? messages;

  const handleSend = (): void => {
    // An accidental empty send looks like a no-op and posts a blank payload
    // consumers then have to filter out; the button is disabled too.
    if (!sendInput.trim()) return;

    const data = { action: branding.actionType, content: sendInput };

    window.parent.postMessage(data, "*");
    setMessages((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          data,
          origin: window.location.origin,
          direction: "sent" as const,
        },
        ...prev,
      ].slice(0, MAX_MESSAGES),
    );
    setSendInput("");
  };

  const handleTogglePause = (): void => {
    setPausedSnapshot(paused ? null : messages);
  };

  const handleClear = (): void => {
    setMessages([]);
    // Clearing implies "start fresh", so it also resumes the live feed.
    setPausedSnapshot(null);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("seed") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([
        {
          id: "seed-1",
          timestamp: Date.now(),
          data: {
            type: "example",
            action: "test",
            payload: {
              userId: 123,
              status: "active",
              metadata: {
                source: "parent-frame",
                version: "1.0.0",
              },
            },
          },
          origin: "https://example.com",
          direction: "received",
        },
      ]);
    }

    const context = params.get("context");

    if (context) {
      try {
        const decodedContext = atob(context);

        setContext(JSON.parse(decodedContext) as Record<string, unknown>);
      } catch (ex) {
        console.error("Context could not be decoded", ex);
        setContextDecodeFailed(true);
      }
    }

    const handleMessage = (event: MessageEvent): void => {
      const newMessage: Message = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        data: event.data,
        origin: event.origin,
        direction: "received",
      };

      setMessages((prev) => [newMessage, ...prev].slice(0, MAX_MESSAGES));
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Message Stream"
        metaDescription="Monitor and log postMessage events in real time across iframes for debugging cross-origin communication."
        path="/message-stream"
        tagline="Listening for messages from parent frame..."
        badge={<Badge>{messages.length} {messages.length === 1 ? "message" : "messages"}</Badge>}
      >

      <div className={styles.sendSection}>
        <label className={styles.fieldLabel} htmlFor="ms-send-input">
          Send to Parent
        </label>
        <input
          id="ms-send-input"
          type="text"
          className={styles.sendInput}
          value={sendInput}
          onChange={(e) => {
            setSendInput(e.target.value);
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Enter message content..."
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!sendInput.trim()}
        >
          Send Message
        </Button>
      </div>

      <hr className={styles.divider} />

      {context && (
        <div className={styles.contextBlock}>
          <div className={styles.fieldLabel}>Context</div>
          <pre className={styles.pre}>{JSON.stringify(context, null, 2)}</pre>
        </div>
      )}

      {contextDecodeFailed && (
        <div className={styles.contextBlock}>
          <div className={styles.fieldLabel}>Context</div>
          <div className={styles.contextError}>
            context param could not be decoded
          </div>
        </div>
      )}

      <div className={styles.listHeader}>
        <span className={styles.listMeta}>
          Newest first
          {messages.length >= MAX_MESSAGES && ` · showing latest ${MAX_MESSAGES}`}
          {paused &&
            ` · paused (${messages.length - visibleMessages.length} new)`}
        </span>
        <div className={styles.listControls}>
          <Button variant="ghost" size="xs" onClick={handleTogglePause}>
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="reset"
            size="xs"
            onClick={handleClear}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className={styles.list}>
        {visibleMessages.length === 0 ? (
          <div className={styles.empty}>No messages received yet</div>
        ) : (
          visibleMessages.map((message, index) => (
            <div
              key={message.id}
              className={`${styles.card} ${message.direction === "sent" ? styles.cardSent : styles.cardReceived}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIndex}>
                    #{visibleMessages.length - index}
                  </div>
                  <div
                    className={`${styles.directionBadge} ${message.direction === "sent" ? styles.directionSent : styles.directionReceived}`}
                  >
                    {message.direction === "sent" ? "↑ sent" : "↓ received"}
                  </div>
                </div>
                <div className={styles.cardHeaderRight}>
                  <div className={styles.cardTime}>
                    {formatTimeWithMs(new Date(message.timestamp))}
                  </div>
                  <CopyButton
                    value={JSON.stringify(message.data, null, 2)}
                    variant="ghost"
                    size="xs"
                  />
                </div>
              </div>

              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>Origin</div>
                  <div className={styles.fieldValue}>{message.origin}</div>
                </div>
                <div>
                  <div className={styles.fieldLabel}>Data</div>
                  <pre className={styles.pre}>
                    {JSON.stringify(message.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </PageLayout>
    </div>
  );
}
