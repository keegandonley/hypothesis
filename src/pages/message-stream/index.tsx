import { useEffect, useState } from "react";
import { Badge, PageLayout } from "@/components/ui";
import styles from "@/styles/message-stream.module.css";
import { useBranding } from "@/lib/branding";

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
  const [sendInput, setSendInput] = useState("");

  const handleSend = (): void => {
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
        <div className={styles.fieldLabel}>Send to Parent</div>
        <input
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
        <button className={styles.sendBtn} onClick={handleSend}>
          Send Message
        </button>
      </div>

      <hr className={styles.divider} />

      {context && (
        <div className={styles.contextBlock}>
          <div className={styles.fieldLabel}>Context</div>
          <pre className={styles.pre}>{JSON.stringify(context, null, 2)}</pre>
        </div>
      )}

      <div className={styles.list}>
        {messages.length === 0 ? (
          <div className={styles.empty}>No messages received yet</div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`${styles.card} ${message.direction === "sent" ? styles.cardSent : styles.cardReceived}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <div className={styles.cardIndex}>
                    #{messages.length - index}
                  </div>
                  <div
                    className={`${styles.directionBadge} ${message.direction === "sent" ? styles.directionSent : styles.directionReceived}`}
                  >
                    {message.direction === "sent" ? "↑ sent" : "↓ received"}
                  </div>
                </div>
                <div className={styles.cardTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
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
