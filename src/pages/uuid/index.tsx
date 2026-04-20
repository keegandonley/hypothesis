import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/uuid.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { v1, v4, v7 } from "uuid";

const generators = { 1: v1, 4: v4, 7: v7 } as const;

function generate(ver: 1 | 4 | 7): string {
  return (generators[ver] as () => string)();
}

export default function UuidPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [uuid, setUuid] = useState("");
  const [version, setVersion] = useState<1 | 4 | 7>(4);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (ver: number) => {
    const params = new URLSearchParams({ version: String(ver) });
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verParam = params.get("version");
    const ver = (verParam === "1" || verParam === "7" ? Number(verParam) : 4) as 1 | 4 | 7;
    setVersion(ver);
    setUuid(generate(ver));
    history.replaceState(null, "", buildUrl(ver));
  }, []);

  const handleRegenerate = () => {
    setUuid(generate(version));
  };

  const handleVersionChange = (ver: 1 | 4 | 7) => {
    setVersion(ver);
    setUuid(generate(ver));
    history.replaceState(null, "", buildUrl(ver));
  };

  const handleCopy = () => {
    copyToClipboard(uuid).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="UUID Generator"
        description="Generate cryptographically secure UUIDs (v1, v4, v7) and inspect existing ones. Free online UUID generator — no installation required. No data sent to servers."
        path="/uuid"
        brandName={branding.name}
      />
      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/uuid"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>UUID</h1>
        <p className={styles.tagline}>Generate UUIDs of any version with one click</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Generated UUID</span>
            <div className={styles.panelHeaderRight}>
              {([1, 4, 7] as const).map((ver) => (
                <button
                  key={ver}
                  className={`${styles.toggleBtn}${version === ver ? ` ${styles.active}` : ""}`}
                  onClick={() => handleVersionChange(ver)}
                >
                  v{ver}
                </button>
              ))}
              <span className={version === 4 ? styles.badgeBlue : styles.badgeAlt}>v{version}</span>
            </div>
          </div>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.uuidDisplay}
              value={uuid}
              readOnly
              spellCheck={false}
            />
            {!isIframe && (
              <button
                className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.bottomRow}>
        <button className={styles.regenerateBtn} onClick={handleRegenerate}>
          Regenerate
        </button>
      </div>
    </div>
  );
}
