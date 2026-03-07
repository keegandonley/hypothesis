import { useEffect, useState } from "react";
import styles from "../../styles/messages.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";

interface Message {
  id: string;
  timestamp: number;
  data: any;
  origin: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seed") === "true") {
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
        },
      ]);
    }

    const context = params.get("context");

    if (context) {
      try {
        const decodedContext = atob(context);
        setContext(JSON.parse(decodedContext));
      } catch (ex) {
        console.error("Context could not be decoded", ex);
      }
    }

    const handleMessage = (event: MessageEvent) => {
      console.log(event);
      const newMessage: Message = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        data: event.data,
        origin: event.origin,
      };

      setMessages((prev) => [newMessage, ...prev]);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          hypothesis.sh |{" "}
          <Link
            href="/docs/messages"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Frame Messages</h1>
        <p className={styles.tagline}>
          Listening for messages from parent frame...
        </p>
        <div className={styles.badge}>
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </div>
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
            <div key={message.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIndex}>
                  #{messages.length - index}
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
    </div>
  );
}
