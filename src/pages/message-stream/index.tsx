import { useEffect, useState } from "react";
import Head from "next/head";
import styles from "../../styles/message-stream.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";

interface Message {
  id: string;
  timestamp: number;
  data: any;
  origin: string;
  direction: "sent" | "received";
}

export default function MessagesPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<Record<string, unknown> | null>(null);
  const [sendInput, setSendInput] = useState("");

  const handleSend = () => {
    const data = { action: branding.actionType, content: sendInput };
    window.parent.postMessage(data, "*");
    setMessages((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        data,
        origin: window.location.origin,
        direction: "sent",
      },
      ...prev,
    ]);
  };

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
          direction: "received",
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
        direction: "received",
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
      <Head>
        <title>{branding.name.toUpperCase()} — MESSAGE STREAM</title>
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
            href="/docs/message-stream"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Message Stream</h1>
        <p className={styles.tagline}>
          Listening for messages from parent frame...
        </p>
        <div className={styles.badge}>
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.sendSection}>
        <div className={styles.fieldLabel}>Send to Parent</div>
        <input
          type="text"
          className={styles.sendInput}
          value={sendInput}
          onChange={(e) => setSendInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
    </div>
  );
}
