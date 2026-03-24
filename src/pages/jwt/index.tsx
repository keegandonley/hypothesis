import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/jwt.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { ReferenceLinks } from "@/components/ReferenceLinks";

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
  return decodeURIComponent(escape(atob(padded)));
}

function base64urlEncode(str: string): string {
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
  const sigPart = btoa(Array.from(sigBytes, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${headerPart}.${payloadPart}.${sigPart}`;
}

function decodeJwt(token: string): JwtParts | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64urlDecode(parts[0]));
    const payload = JSON.parse(base64urlDecode(parts[1]));
    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
}

function getExpiryStatus(payload: Record<string, unknown> | null): ExpiryStatus {
  if (!payload || !("exp" in payload)) return "no-exp";
  const exp = payload.exp as number;
  return exp < Date.now() / 1000 ? "expired" : "valid";
}

export default function JwtPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<JwtParts | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (t: string) => {
    if (!t) return `${window.location.origin}${window.location.pathname}`;
    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(t)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    if (v) {
      setToken(v);
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

  const handleTokenChange = (value: string) => {
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

  const handleGenerate = () => {
    const t = generateJwt();
    handleTokenChange(t);
  };

  const handleReset = () => {
    setToken("");
    setDecoded(null);
    setError(false);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const expiryStatus = getExpiryStatus(decoded?.payload ?? null);
  const hasToken = token.length > 0;

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — JWT DECODER`}</title>
        <meta name="description" content="Decode JWT tokens and inspect header, payload claims, and expiry status in your browser." />
        <meta property="og:title" content="JWT Decoder" />
        <meta property="og:description" content="Decode JWT tokens and inspect header, payload claims, and expiry status in your browser." />
        <meta property="og:url" content="https://hypothesis.sh/jwt" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="JWT Decoder" />
        <meta name="twitter:description" content="Decode JWT tokens and inspect header, payload claims, and expiry status in your browser." />
        <link rel="canonical" href="https://hypothesis.sh/jwt" />
      </Head>

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/jwt"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>JWT Decoder</h1>
        <p className={styles.tagline}>Decode JWT tokens and inspect header, payload, and expiry</p>
        <ReferenceLinks refs={[{ name: "HTTP Headers", slug: "http-headers" }, { name: "HTTP Status Codes", slug: "http-status-codes" }]} />
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelLabel}>Token</span>
          <div className={styles.panelHeaderRight}>
            {hasToken && error && (
              <span className={styles.badgeError}>malformed</span>
            )}
            {hasToken && !error && decoded && (
              <span className={styles.badge}>{token.trim().length} chars</span>
            )}
            <button className={styles.generateBtn} onClick={handleGenerate}>
              Generate
            </button>
          </div>
        </div>
        <div className={styles.textareaWrapper}>
          <textarea
            className={styles.textarea}
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            placeholder="Paste JWT token here..."
            spellCheck={false}
          />
        </div>
      </div>

      <div className={styles.outputPanels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Header</span>
          </div>
          <div className={styles.outputWrapper}>
            <pre className={styles.output}>
              {decoded?.header
                ? JSON.stringify(decoded.header, null, 2)
                : hasToken && error
                ? ""
                : ""}
            </pre>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Payload</span>
            <div className={styles.panelHeaderRight}>
              {decoded?.payload && (
                expiryStatus === "valid" ? (
                  <span className={styles.badgeValid}>valid</span>
                ) : expiryStatus === "expired" ? (
                  <span className={styles.badgeExpired}>expired</span>
                ) : (
                  <span className={styles.badgeMuted}>no exp</span>
                )
              )}
            </div>
          </div>
          <div className={styles.outputWrapper}>
            <pre className={styles.output}>
              {decoded?.payload ? JSON.stringify(decoded.payload, null, 2) : ""}
            </pre>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Signature</span>
          </div>
          <div className={styles.outputWrapper}>
            <pre className={`${styles.output} ${styles.outputMuted}`}>
              {decoded?.signature ?? ""}
            </pre>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
