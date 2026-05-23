import { useEffect, useState } from "react";
import styles from "@/styles/my-ip.module.css";
import { useBranding } from "@/lib/branding";
import { Button, CopyButton, PageLayout } from "@/components/ui";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import type { IpData } from "../api/my-ip";
import { ReferenceLinks } from "@/components/ReferenceLinks";

type Status = "idle" | "loading" | "success" | "error";

export default function MyIpPage(): React.ReactNode {
  const branding = useBranding();
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
      <PageLayout
        metaTitle="My IP"
        metaDescription="Look up your current public IP address, geolocation, and network details. Free online IP lookup tool."
        path="/my-ip"
        h1="My IP"
        tagline="Your current public IP address and location info"
      >
        <ReferenceLinks
          refs={[
            { name: "DNS Record Types", slug: "dns-record-types" },
            { name: "Port Numbers", slug: "port-numbers" },
          ]}
        />

      <div className={styles.body}>
        <Panel>
          <PanelHeader label="Public IP Address">
            {data && <CopyButton value={data.ip} variant="ghost" size="sm" />}
          </PanelHeader>
          <div className={styles.ipValue}>
            {status === "loading" && (
              <span className={styles.muted}>Fetching…</span>
            )}
            {status === "error" && (
              <span className={styles.error}>Failed to fetch IP</span>
            )}
            {status === "success" && data && <span>{data.ip}</span>}
          </div>
        </Panel>

        {status === "success" && data && (
          <Panel>
            <PanelHeader label="Location" />
            <div className={styles.table}>
              {rows.map(({ label, value }) => (
                <div key={label} className={styles.row}>
                  <span className={styles.rowLabel}>{label}</span>
                  <span className={styles.rowValue}>{value ?? "—"}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Panel>
            <PanelHeader label="API">
              <CopyButton value={curlCommand} variant="ghost" size="sm" />
            </PanelHeader>
            <div className={styles.curlRow}>
              <code className={styles.curlCode}>{curlCommand}</code>
            </div>
          </Panel>
      </div>

      <hr className={styles.divider} />

      <div className={styles.bottomRow}>
        <Button variant="copy" onClick={fetchIp} disabled={status === "loading"}>
          {status === "loading" ? "Fetching…" : "Refresh"}
        </Button>
      </div>
      </PageLayout>
    </div>
  );
}
