import { useEffect, useState } from "react";
import styles from "@/styles/jwt.module.css";
import { Badge, Button, Panel, PanelHeader, PanelBody, PageLayout, PermalinkRow } from "@/components/ui";
interface JwtParts {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
}

type ExpiryStatus = "valid" | "expired" | "no-exp";

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;

  return decodeURIComponent(
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    escape(atob(padded)),
  );
}

function base64urlEncode(str: string): string {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

const SAMPLE_NAMES = ["alice", "bob", "carol", "dave", "eve", "frank"];
const SAMPLE_ROLES = ["admin", "user", "editor", "viewer", "moderator"];

function generateJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  const name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
  const role = SAMPLE_ROLES[Math.floor(Math.random() * SAMPLE_ROLES.length)];
  const sub = crypto.randomUUID();

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub,
    name,
    role,
    iat: now,
    exp: now + 3600,
  };

  const headerPart = base64urlEncode(JSON.stringify(header));
  const payloadPart = base64urlEncode(JSON.stringify(payload));

  // Fake but structurally valid signature (random bytes)
  const sigBytes = new Uint8Array(32);

  crypto.getRandomValues(sigBytes);
  const sigPart = btoa(
    Array.from(sigBytes, (b) => String.fromCharCode(b)).join(""),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${headerPart}.${payloadPart}.${sigPart}`;
}

function decodeJwt(token: string): JwtParts | null {
  const parts = token.split(".");

  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64urlDecode(parts[0])) as Record<
      string,
      unknown
    >;
    const payload = JSON.parse(base64urlDecode(parts[1])) as Record<
      string,
      unknown
    >;

    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
}

function getExpiryStatus(
  payload: Record<string, unknown> | null,
): ExpiryStatus {
  if (!payload || !("exp" in payload)) return "no-exp";
  const exp = payload.exp as number;

  return exp < Date.now() / 1000 ? "expired" : "valid";
}

export default function JwtPage(): React.ReactNode {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<JwtParts | null>(null);
  const [error, setError] = useState(false);
  const [url, setUrl] = useState("");

  const buildUrl = (t: string): string => {
    if (!t) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(t)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");

    if (v) {
      setToken(v); // eslint-disable-line react-hooks/set-state-in-effect
      const result = decodeJwt(v);

      if (result) {
        setDecoded(result);
        setError(false);
      } else {
        setDecoded(null);
        setError(true);
      }
    }

    setUrl(window.location.href);
  }, []);

  const handleTokenChange = (value: string): void => {
    setToken(value);
    if (!value) {
      setDecoded(null);
      setError(false);
    } else {
      const result = decodeJwt(value.trim());

      if (result) {
        setDecoded(result);
        setError(false);
      } else {
        setDecoded(null);
        setError(true);
      }
    }

    const newUrl = buildUrl(value.trim());

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleGenerate = (): void => {
    const t = generateJwt();

    handleTokenChange(t);
  };

  const handleReset = (): void => {
    setToken("");
    setDecoded(null);
    setError(false);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const expiryStatus = getExpiryStatus(decoded?.payload ?? null);
  const hasToken = token.length > 0;

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="JWT Decoder"
        metaDescription="Decode and inspect JWT tokens online — view header, payload claims, and expiry status. Free, no installation required. No data sent to servers."
        path="/jwt"
        h1="JWT Decoder"
        tagline="Decode JWT tokens and inspect header, payload, and expiry"
        refs={[
          { name: "HTTP Headers", slug: "http-headers" },
          { name: "HTTP Status Codes", slug: "http-status-codes" },
        ]}
      >

      <div className={styles.inputPanel}>
        <PanelHeader label="Token">
          {hasToken && error && (
            <Badge color="error">malformed</Badge>
          )}
          {hasToken && !error && decoded && (
            <Badge>{token.trim().length} chars</Badge>
          )}
          <Button variant="copy" size="sm" onClick={handleGenerate}>
            Generate
          </Button>
        </PanelHeader>
        <PanelBody>
          <textarea
            className={styles.textarea}
            value={token}
            onChange={(e) => {
              handleTokenChange(e.target.value);
            }}
            placeholder="Paste JWT token here..."
            spellCheck={false}
          />
        </PanelBody>
      </div>

      <div className={styles.outputPanels}>
        <Panel>
          <PanelHeader label="Header" />
          <div className={styles.outputWrapper}>
            <pre className={styles.output}>
              {decoded?.header
                ? JSON.stringify(decoded.header, null, 2)
                : hasToken && error
                  ? ""
                  : ""}
            </pre>
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="Payload">
            {decoded?.payload &&
              (expiryStatus === "valid" ? (
                <Badge className={styles.badgeValid}>valid</Badge>
              ) : expiryStatus === "expired" ? (
                <Badge className={styles.badgeExpired}>expired</Badge>
              ) : (
                <Badge className={styles.badgeMuted}>no exp</Badge>
              ))}
          </PanelHeader>
          <div className={styles.outputWrapper}>
            <pre className={styles.output}>
              {decoded?.payload ? JSON.stringify(decoded.payload, null, 2) : ""}
            </pre>
          </div>
        </Panel>

        <Panel>
          <PanelHeader label="Signature" />
          <div className={styles.outputWrapper}>
            <pre className={`${styles.output} ${styles.outputMuted}`}>
              {decoded?.signature ?? ""}
            </pre>
          </div>
        </Panel>
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
