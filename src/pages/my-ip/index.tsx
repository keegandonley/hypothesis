import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/my-ip.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import type { IpData } from "../api/my-ip";
import { ReferenceLinks } from "@/components/ReferenceLinks";

type Status = "idle" | "loading" | "success" | "error";

export default function MyIpPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [data, setData] = useState<IpData | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyCurlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchIp = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/my-ip");
      if (!res.ok) throw new Error("Request failed");
      const json: IpData = await res.json();
      setData(json);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchIp();
  }, []);

  const handleCopy = () => {
    if (!data) return;
    copyToClipboard(data.ip).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const curlCommand = `curl https://${branding.domain}/api/my-ip`;

  const handleCopyCurl = () => {
    copyToClipboard(curlCommand).then(() => {
      setCopiedCurl(true);
      if (copyCurlTimeoutRef.current) clearTimeout(copyCurlTimeoutRef.current);
      copyCurlTimeoutRef.current = setTimeout(() => setCopiedCurl(false), 1500);
    });
  };

  const rows: { label: string; value: string | null | undefined }[] = data
    ? [
        { label: "City", value: data.city },
        { label: "Region", value: data.region },
        { label: "Country", value: data.country },
        { label: "Latitude", value: data.latitude },
        { label: "Longitude", value: data.longitude },
        { label: "Timezone", value: data.timezone },
      ]
    : [];

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — MY IP`}</title>
        <meta name="description" content="Look up your current public IP address and geolocation details." />
        <meta property="og:title" content="My IP" />
        <meta property="og:description" content="Look up your current public IP address and geolocation details." />
        <meta property="og:url" content="https://hypothesis.sh/my-ip" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="My IP" />
        <meta name="twitter:description" content="Look up your current public IP address and geolocation details." />
        <link rel="canonical" href="https://hypothesis.sh/my-ip" />
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
          <Link href="/docs/my-ip" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>My IP</h1>
        <p className={styles.tagline}>Your current public IP address and location info</p>
        <ReferenceLinks refs={[{ name: "DNS Record Types", slug: "dns-record-types" }, { name: "Port Numbers", slug: "port-numbers" }]} />
      </div>

      <hr className={styles.divider} />

      <div className={styles.body}>
        <div className={styles.ipPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Public IP Address</span>
            {!isIframe && data && (
              <button
                className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <div className={styles.ipValue}>
            {status === "loading" && <span className={styles.muted}>Fetching…</span>}
            {status === "error" && <span className={styles.error}>Failed to fetch IP</span>}
            {status === "success" && data && <span>{data.ip}</span>}
          </div>
        </div>

        {status === "success" && data && (
          <div className={styles.detailsPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Location</span>
            </div>
            <div className={styles.table}>
              {rows.map(({ label, value }) => (
                <div key={label} className={styles.row}>
                  <span className={styles.rowLabel}>{label}</span>
                  <span className={styles.rowValue}>{value ?? "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isIframe && (
          <div className={styles.detailsPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>API</span>
              <button
                className={`${styles.copyBtn}${copiedCurl ? ` ${styles.copied}` : ""}`}
                onClick={handleCopyCurl}
              >
                {copiedCurl ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className={styles.curlRow}>
              <code className={styles.curlCode}>{curlCommand}</code>
            </div>
          </div>
        )}
      </div>

      <hr className={styles.divider} />

      <div className={styles.bottomRow}>
        <button
          className={styles.refreshBtn}
          onClick={fetchIp}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Fetching…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
