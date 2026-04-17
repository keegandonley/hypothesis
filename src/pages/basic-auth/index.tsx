import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/basic-auth.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

function encodeBasicAuth(username: string, password: string): string {
  return btoa(`${username}:${password}`);
}

export default function BasicAuthPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const encoded = encodeBasicAuth(username, password);
  const headerValue = `Basic ${encoded}`;
  const fullHeader = `Authorization: ${headerValue}`;

  const buildUrl = (u: string) => {
    const params = new URLSearchParams({ username: u });
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("username") ?? "";
    setUsername(u);
    setUrl(buildUrl(u));
  }, []);

  const handleUsernameChange = (u: string) => {
    setUsername(u);
    const newUrl = buildUrl(u);
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

  const handleReset = () => {
    setUsername("");
    setPassword("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopyHeader = () => {
    copyToClipboard(fullHeader).then(() => {
      setCopiedHeader(true);
      if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
      headerTimeoutRef.current = setTimeout(() => setCopiedHeader(false), 1500);
    });
  };

  const handleCopyToken = () => {
    copyToClipboard(encoded).then(() => {
      setCopiedToken(true);
      if (tokenTimeoutRef.current) clearTimeout(tokenTimeoutRef.current);
      tokenTimeoutRef.current = setTimeout(() => setCopiedToken(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — Basic Auth`}</title>
        <meta
          name="description"
          content="Generate HTTP Basic Authentication headers from a username and password."
        />
        <meta property="og:title" content="Basic Auth Generator" />
        <meta
          property="og:description"
          content="Generate HTTP Basic Authentication headers from a username and password."
        />
        <meta property="og:url" content="https://hypothesis.sh/basic-auth" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Basic Auth Generator" />
        <meta
          name="twitter:description"
          content="Generate HTTP Basic Authentication headers from a username and password."
        />
        <link rel="canonical" href="https://hypothesis.sh/basic-auth" />
      </Head>

      <div className={styles.header}>
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
            href="/docs/basic-auth"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Basic Auth</h1>
        <p className={styles.tagline}>
          Generate HTTP Basic Authentication headers from a username and password
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.body}>
        <div className={styles.inputs}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="username"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="password">
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`${styles.input} ${styles.passwordInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                className={styles.showHideBtn}
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.outputs}>
          <div className={styles.outputBlock}>
            <div className={styles.outputHeader}>
              <span className={styles.outputLabel}>Authorization Header</span>
              {!isIframe && (
                <button
                  className={`${styles.panelCopyBtn}${copiedHeader ? ` ${styles.panelCopied}` : ""}`}
                  onClick={handleCopyHeader}
                >
                  {copiedHeader ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className={styles.outputValue}>{fullHeader || "—"}</div>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHeader}>
              <span className={styles.outputLabel}>Base64 Token</span>
              {!isIframe && (
                <button
                  className={`${styles.panelCopyBtn}${copiedToken ? ` ${styles.panelCopied}` : ""}`}
                  onClick={handleCopyToken}
                >
                  {copiedToken ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className={styles.outputValue}>{encoded || "—"}</div>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHeader}>
              <span className={styles.outputLabel}>Decoded</span>
            </div>
            <div className={styles.outputValue}>
              {username || password ? `${username}:${password}` : "—"}
            </div>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.permalinkLabel}>Permalink</span>
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
