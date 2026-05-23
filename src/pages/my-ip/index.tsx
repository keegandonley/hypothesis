import { useEffect, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "@/styles/my-ip.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { Button, CopyButton } from "@/components/ui";
import type { IpData } from "../api/my-ip";
import { ReferenceLinks } from "@/components/ReferenceLinks";

type Status = "idle" | "loading" | "success" | "error";

export default function MyIpPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [data, setData] = useState<IpData | null>(null);
  const [status, setStatus] = useState<Status>("idle");


  const fetchIp = async (): Promise<void> => {
    setStatus("loading");
    try {
      const res = await fetch("/api/my-ip");

      if (!res.ok) throw new Error("Request failed");
      const json = (await res.json()) as IpData;

      setData(json);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    void fetchIp(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const curlCommand = `curl https://${branding.domain}/api/my-ip`;

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
      <ToolHead
        title="My IP"
        description="Look up your current public IP address, geolocation, and network details. Free online IP lookup tool."
        path="/my-ip"
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
            href="/docs/my-ip"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>My IP</h1>
        <p className={styles.tagline}>
          Your current public IP address and location info
        </p>
        <ReferenceLinks
          refs={[
            { name: "DNS Record Types", slug: "dns-record-types" },
            { name: "Port Numbers", slug: "port-numbers" },
          ]}
        />
      </div>

      <hr className={styles.divider} />

      <div className={styles.body}>
        <div className={styles.ipPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Public IP Address</span>
            {data && <CopyButton value={data.ip} variant="ghost" size="sm" />}
          </div>
          <div className={styles.ipValue}>
            {status === "loading" && (
              <span className={styles.muted}>Fetching…</span>
            )}
            {status === "error" && (
              <span className={styles.error}>Failed to fetch IP</span>
            )}
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

        <div className={styles.detailsPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>API</span>
              <CopyButton value={curlCommand} variant="ghost" size="sm" />
            </div>
            <div className={styles.curlRow}>
              <code className={styles.curlCode}>{curlCommand}</code>
            </div>
          </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.bottomRow}>
        <Button variant="copy" onClick={fetchIp} disabled={status === "loading"}>
          {status === "loading" ? "Fetching…" : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
