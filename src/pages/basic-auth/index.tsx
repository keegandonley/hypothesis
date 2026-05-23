import React, { useEffect, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "@/styles/basic-auth.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { Button, CopyButton, PermalinkRow } from "@/components/ui";

function encodeBasicAuth(username: string, password: string): string {
  return btoa(`${username}:${password}`);
}

function decodeBasicAuth(
  input: string,
): { username: string; password: string } | null {
  try {
    const token = input.replace(/^Basic\s+/i, "").trim();

    if (!token) return null;
    const decoded = atob(token);
    const colonIdx = decoded.indexOf(":");

    if (colonIdx === -1) return { username: decoded, password: "" };

    return {
      username: decoded.slice(0, colonIdx),
      password: decoded.slice(colonIdx + 1),
    };
  } catch {
    return null;
  }
}

export default function BasicAuthPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();

  const [mode, setMode] = useState<"encode" | "decode">("encode");

  // encode state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // decode state
  const [tokenInput, setTokenInput] = useState("");
  const [showDecodedPassword, setShowDecodedPassword] = useState(false);

  const [url, setUrl] = useState("");

  const encoded = encodeBasicAuth(username, password);
  const headerValue = `Basic ${encoded}`;
  const fullHeader = `Authorization: ${headerValue}`;

  const decodeResult = tokenInput ? decodeBasicAuth(tokenInput) : null;
  const decodeInvalid = tokenInput.length > 0 && decodeResult === null;

  const buildEncodeUrl = (u: string): string => {
    const params = new URLSearchParams({ username: u });

    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  const buildDecodeUrl = (t: string): string => {
    if (!t) return `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({ token: t });

    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") ?? "";
    const u = params.get("username") ?? "";

    if (t) {
      setMode("decode"); // eslint-disable-line react-hooks/set-state-in-effect
      setTokenInput(t);
      setUrl(buildDecodeUrl(t));
    } else {
      setUsername(u);
      setUrl(buildEncodeUrl(u));
    }
  }, []);

  const handleModeChange = (newMode: "encode" | "decode"): void => {
    setMode(newMode);
    setUsername("");
    setPassword("");
    setTokenInput("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleUsernameChange = (u: string): void => {
    setUsername(u);
    const newUrl = buildEncodeUrl(u);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleTokenChange = (v: string): void => {
    setTokenInput(v);
    const newUrl = buildDecodeUrl(v);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setUsername("");
    setPassword("");
    setTokenInput("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="Basic Auth"
        description="Generate and decode HTTP Basic Authentication headers. Free online Basic Auth encoder and decoder — no installation required. No data sent to servers."
        path="/basic-auth"
        brandName={branding.name}
      />

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
          Generate and decode HTTP Basic Authentication headers
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.modeTabs} role="tablist">
        <button
          role="tab"
          aria-selected={mode === "encode"}
          className={`${styles.modeTab}${mode === "encode" ? ` ${styles.modeTabActive}` : ""}`}
          onClick={() => {
            handleModeChange("encode");
          }}
        >
          Encode
        </button>
        <button
          role="tab"
          aria-selected={mode === "decode"}
          className={`${styles.modeTab}${mode === "decode" ? ` ${styles.modeTabActive}` : ""}`}
          onClick={() => {
            handleModeChange("decode");
          }}
        >
          Decode
        </button>
      </div>

      {mode === "encode" ? (
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
                onChange={(e) => {
                  handleUsernameChange(e.target.value);
                }}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  placeholder="password"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className={styles.showHideBtn}
                  onClick={() => {
                    setShowPassword((v) => !v);
                  }}
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
                <CopyButton value={fullHeader} variant="ghost" size="sm" />
              </div>
              <div className={styles.outputValue}>{fullHeader || "—"}</div>
            </div>

            <div className={styles.outputBlock}>
              <div className={styles.outputHeader}>
                <span className={styles.outputLabel}>Base64 Token</span>
                <CopyButton value={encoded} variant="ghost" size="sm" />
              </div>
              <div className={styles.outputValue}>{encoded || "—"}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.inputs}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="token">
                Header or Token
              </label>
              <input
                id="token"
                type="text"
                className={`${styles.input}${decodeInvalid ? ` ${styles.inputError}` : ""}`}
                value={tokenInput}
                onChange={(e) => {
                  handleTokenChange(e.target.value);
                }}
                placeholder="Basic dXNlcjpwYXNz"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className={styles.outputs}>
            <div className={styles.outputBlock}>
              <div className={styles.outputHeader}>
                <span className={styles.outputLabel}>Username</span>
                <CopyButton value={decodeResult ? decodeResult.username : ""} variant="ghost" size="sm" disabled={!decodeResult} />
              </div>
              <div
                className={`${styles.outputValue}${!decodeResult ? ` ${styles.outputEmpty}` : ""}`}
              >
                {decodeResult ? decodeResult.username || <em>empty</em> : "—"}
              </div>
            </div>

            <div className={styles.outputBlock}>
              <div className={styles.outputHeader}>
                <span className={styles.outputLabel}>Password</span>
                <div className={styles.outputActions}>
                  <button
                    className={styles.showHideBtn}
                    onClick={() => {
                      setShowDecodedPassword((v) => !v);
                    }}
                    type="button"
                  >
                    {showDecodedPassword ? "hide" : "show"}
                  </button>
                  <CopyButton value={decodeResult ? decodeResult.password : ""} variant="ghost" size="sm" disabled={!decodeResult} />
                </div>
              </div>
              <div
                className={`${styles.outputValue}${!decodeResult ? ` ${styles.outputEmpty}` : ""}`}
              >
                {decodeResult ? (
                  showDecodedPassword ? (
                    decodeResult.password || <em>empty</em>
                  ) : decodeResult.password ? (
                    "••••••••"
                  ) : (
                    <em>empty</em>
                  )
                ) : (
                  "—"
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
