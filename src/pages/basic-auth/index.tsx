import React, { useEffect, useState } from "react";
import styles from "@/styles/basic-auth.module.css";
import { Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { encodeBasicAuth, decodeBasicAuth } from "@/lib/basic-auth";

export default function BasicAuthPage(): React.ReactNode {
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
      <PageLayout
        metaTitle="Basic Auth"
        metaDescription="Generate and decode HTTP Basic Authentication headers. Free online Basic Auth encoder and decoder — no installation required. No data sent to servers."
        path="/basic-auth"
        h1="Basic Auth"
        tagline="Generate and decode HTTP Basic Authentication headers"
      >

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
                <span className={styles.showHideWrap}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPassword((v) => !v);
                    }}
                  >
                    {showPassword ? "hide" : "show"}
                  </Button>
                </span>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDecodedPassword((v) => !v);
                    }}
                  >
                    {showDecodedPassword ? "hide" : "show"}
                  </Button>
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
      </PageLayout>
    </div>
  );
}
