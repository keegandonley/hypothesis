import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/gist.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

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

export default function GistPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [permalinkCopied, setPermalinkCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const permalinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = GIST_URL_RE.test(url);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("url") ?? "";
    const f = params.get("file") ?? "";
    setUrl(u);
    setFile(f);
    setPageUrl(window.location.href);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUrlChange = (u: string) => {
    setUrl(u);
    const next = buildPageUrl(u, file);
    history.replaceState(null, "", next);
    setPageUrl(next);
  };

  const handleFileChange = (f: string) => {
    setFile(f);
    const next = buildPageUrl(url, f);
    history.replaceState(null, "", next);
    setPageUrl(next);
  };

  const handleReload = () => setIframeKey((k) => k + 1);

  const handleReset = () => {
    setUrl("");
    setFile("");
    setIframeKey((k) => k + 1);
    const next = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", next);
    setPageUrl(next);
  };

  const handleCopyPermalink = () => {
    copyToClipboard(pageUrl).then(() => {
      setPermalinkCopied(true);
      if (permalinkTimeoutRef.current) clearTimeout(permalinkTimeoutRef.current);
      permalinkTimeoutRef.current = setTimeout(() => setPermalinkCopied(false), 1500);
    });
  };

  const handleCopyApiUrl = () => {
    if (!isValid) return;
    const apiUrl = `${window.location.origin}${buildApiUrl(url, file)}`;
    copyToClipboard(apiUrl);
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="Gist Proxy"
        description="Load and render GitHub Gist files inline. Free online Gist viewer."
        path="/gist"
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
            href="/docs/gist"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Gist</h1>
        <p className={styles.tagline}>
          Serve a public GitHub Gist's raw content via a proxy URL — preview it live
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputRow}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel} htmlFor="gist-url">Gist URL</label>
          <input
            id="gist-url"
            className={styles.input}
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://gist.github.com/user/abc123"
            spellCheck={false}
          />
        </div>
        <div className={styles.inputGroupNarrow}>
          <label className={styles.inputLabel} htmlFor="gist-file">File <span className={styles.optional}>(optional)</span></label>
          <input
            id="gist-file"
            className={styles.input}
            type="text"
            value={file}
            onChange={(e) => handleFileChange(e.target.value)}
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
            {url ? "Enter a valid GitHub Gist URL to preview" : "Enter a GitHub Gist URL above to preview its content"}
          </div>
        )}
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{pageUrl}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${permalinkCopied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopyPermalink}
          >
            {permalinkCopied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
