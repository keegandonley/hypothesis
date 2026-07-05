import React, { useEffect, useState } from "react";
import styles from "@/styles/gist.module.css";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { useIsIframe } from "@/lib/useIsIframe";
import { useUrlSync } from "@/lib/useUrlSync";

const GIST_URL_RE = /^https?:\/\/gist\.github\.com\/[^/]+\/([a-f0-9]+)/i;

function buildApiUrl(url: string, file: string): string {
  const params = new URLSearchParams({ url });

  if (file.trim()) params.set("file", file.trim());

  return `/api/gist?${params}`;
}

function buildPageUrl(url: string, file: string): string {
  const params = new URLSearchParams();

  if (url) params.set("url", url);
  if (file.trim()) params.set("file", file.trim());
  const qs = params.toString();

  return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ""}`;
}

export default function GistPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const isIframe = useIsIframe();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [pageUrl, setPageUrl] = useState("");

  const isValid = GIST_URL_RE.test(url);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("url") ?? "";
    const f = params.get("file") ?? "";

    setUrl(u); // eslint-disable-line react-hooks/set-state-in-effect
    setFile(f);
    setPageUrl(window.location.href);
  }, []);

  const handleUrlChange = (u: string): void => {
    setUrl(u);
    const next = buildPageUrl(u, file);

    replaceUrl(next);
    setPageUrl(next);
  };

  const handleFileChange = (f: string): void => {
    setFile(f);
    const next = buildPageUrl(url, f);

    replaceUrl(next);
    setPageUrl(next);
  };

  const handleReload = (): void => {
    setIframeKey((k) => k + 1);
  };

  const handleReset = (): void => {
    setUrl("");
    setFile("");
    setIframeKey((k) => k + 1);
    const next = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(next);
    setPageUrl(next);
  };

  const handleCopyApiUrl = (): void => {
    if (!isValid) return;
    const apiUrl = `${window.location.origin}${buildApiUrl(url, file)}`;

    void copyToClipboard(apiUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Gist Proxy"
        metaDescription="Load and render GitHub Gist files inline. Free online Gist viewer."
        path="/gist"
        h1="Gist"
        tagline="Serve a public GitHub Gist's raw content via a proxy URL — preview it live"
      >

      <div className={styles.inputRow}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="gist-url">
            Gist URL
          </label>
          <input
            id="gist-url"
            className={styles.input}
            type="text"
            value={url}
            onChange={(e) => {
              handleUrlChange(e.target.value);
            }}
            placeholder="https://gist.github.com/user/abc123"
            spellCheck={false}
          />
        </div>
        <div className={styles.inputGroupNarrow}>
          <label className={styles.inputLabel} htmlFor="gist-file">
            File <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="gist-file"
            className={styles.input}
            type="text"
            value={file}
            onChange={(e) => {
              handleFileChange(e.target.value);
            }}
            placeholder="index.html"
            spellCheck={false}
          />
        </div>
        {!isIframe && (
          <div className={styles.inputActions}>
            <button
              className={styles.actionBtn}
              disabled={!isValid}
              onClick={handleReload}
            >
              Reload
            </button>
            <button
              className={styles.actionBtn}
              disabled={!isValid}
              onClick={handleCopyApiUrl}
            >
              Copy URL
            </button>
          </div>
        )}
      </div>

      <div className={styles.previewPanel}>
        {isValid ? (
          <iframe
            key={iframeKey}
            className={styles.iframe}
            src={buildApiUrl(url, file)}
            sandbox="allow-scripts allow-same-origin"
            title="Gist preview"
          />
        ) : (
          <div className={styles.emptyState}>
            {url
              ? "Enter a valid GitHub Gist URL to preview"
              : "Enter a GitHub Gist URL above to preview its content"}
          </div>
        )}
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={pageUrl} onReset={handleReset} />
    </div>
  );
}
