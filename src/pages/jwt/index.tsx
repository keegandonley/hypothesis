import { useEffect, useState } from "react";
import styles from "@/styles/jwt.module.css";
import { Badge, Button, Panel, PanelHeader, PanelBody, PageLayout, PermalinkRow } from "@/components/ui";
import { decodeJwt, getExpiryStatus, generateJwt } from "@/lib/jwt";
import type { JwtParts } from "@/lib/jwt";
import { useUrlSync } from "@/lib/useUrlSync";

export default function JwtPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
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

    replaceUrl(newUrl);
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

    replaceUrlNow(newUrl);
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
            <Badge color="warn">malformed</Badge>
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
