import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/cidr.module.css";
import { Badge, Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { type CidrInfo, parseCidr, formatNumber } from "@/lib/cidr";
import { useUrlSync } from "@/lib/useUrlSync";

export default function CidrPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [input, setInput] = useState("");
  const [info, setInfo] = useState<CidrInfo | null>(null);
  const [error, setError] = useState(false);
  const [url, setUrl] = useState("");


  const buildUrl = (cidr: string): string => {
    if (!cidr) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?cidr=${encodeURIComponent(cidr)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cidr = params.get("cidr");

    if (cidr) {
      setInput(cidr);

      const result = parseCidr(cidr);

      if (result) setInfo(result);
    }

    setUrl(window.location.href);
  }, []);

  const handleChange = (raw: string): void => {
    setInput(raw);
    const trimmed = raw.trim();

    if (!trimmed) {
      setInfo(null);
      setError(false);
      const newUrl = buildUrl("");

      replaceUrl(newUrl);
      setUrl(newUrl);

      return;
    }

    const result = parseCidr(trimmed);

    if (!result) {
      setInfo(null);
      setError(true);

      return;
    }

    setInfo(result);
    setError(false);
    const newUrl = buildUrl(trimmed);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setInput("");
    setInfo(null);
    setError(false);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };



  const rows: { label: string; key: string; value: string }[] = info
    ? [
        {
          label: "Network Address",
          key: "network",
          value: info.networkAddress,
        },
        {
          label: "Broadcast Address",
          key: "broadcast",
          value: info.broadcastAddress,
        },
        { label: "Subnet Mask", key: "mask", value: info.subnetMask },
        { label: "Wildcard Mask", key: "wildcard", value: info.wildcardMask },
        { label: "First Host", key: "first", value: info.firstHost },
        { label: "Last Host", key: "last", value: info.lastHost },
        {
          label: "Total Hosts",
          key: "total",
          value: formatNumber(info.totalHosts),
        },
        {
          label: "Usable Hosts",
          key: "usable",
          value: formatNumber(info.usableHosts),
        },
        {
          label: "CIDR Notation",
          key: "cidr",
          value: `${info.networkAddress}/${info.prefix}`,
        },
        {
          label: "IPv4 Class",
          key: "class",
          value: info.privateRange
            ? `Class ${info.ipClass} · Private (${info.privateRange})`
            : `Class ${info.ipClass}`,
        },
      ]
    : [];

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="CIDR Calculator"
        metaDescription="Calculate subnet details from CIDR notation: network address, broadcast, mask, host range, and usable IPs. Free online CIDR calculator — no installation required."
        path="/cidr"
        h1="CIDR"
        tagline="Calculate subnet details from CIDR notation"
        refs={[
          { name: "DNS Record Types", slug: "dns-record-types" },
          { name: "Port Numbers", slug: "port-numbers" },
        ]}
      >

      <div className={styles.inputRow}>
        <input
          className={`${styles.input}${error ? ` ${styles.inputError}` : ""}`}
          value={input}
          onChange={(e) => {
            handleChange(e.target.value);
          }}
          placeholder="e.g. 192.168.1.0/24"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        {error && <Badge color="warn">invalid</Badge>}
      </div>

      {info && (
        <div className={styles.results}>
          {rows.map(({ label, key, value }) => (
            <div key={key} className={styles.resultRow}>
              <span className={styles.resultLabel}>{label}</span>
              <span className={styles.resultValue}>{value}</span>
              <CopyButton value={value} variant="ghost" size="xs" />
            </div>
          ))}
        </div>
      )}

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
