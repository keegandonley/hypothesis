import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/cidr.module.css";
import { Badge, Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { ReferenceLinks } from "@/components/ReferenceLinks";

interface CidrInfo {
  ip: string;
  prefix: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: string;
  isPrivate: boolean;
  privateRange: string | null;
}

function intToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);

  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

function isValidIp(ip: string): boolean {
  const parts = ip.split(".");

  if (parts.length !== 4) return false;

  return parts.every((p) => {
    const n = parseInt(p, 10);

    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

function getIpClass(firstOctet: number): string {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (Multicast)";

  return "E (Reserved)";
}

function getPrivateRange(ipInt: number): string | null {
  const a = (ipInt >>> 24) & 0xff;
  const b = (ipInt >>> 16) & 0xff;

  if (a === 10) return "10.0.0.0/8";
  if (a === 172 && b >= 16 && b <= 31) return "172.16.0.0/12";
  if (a === 192 && b === 168) return "192.168.0.0/16";
  if (a === 127) return "127.0.0.0/8 (Loopback)";

  return null;
}

function parseCidr(input: string): CidrInfo | null {
  const trimmed = input.trim();
  let ipStr: string;
  let prefix: number;

  if (trimmed.includes("/")) {
    const [ipPart, prefixPart] = trimmed.split("/");

    ipStr = ipPart;
    prefix = parseInt(prefixPart, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;
  } else {
    ipStr = trimmed;
    prefix = 32;
  }

  if (!isValidIp(ipStr)) return null;

  const ipInt = ipToInt(ipStr);
  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;

  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

  const firstHostInt = prefix >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastHostInt = prefix >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;

  const firstOctet = (ipInt >>> 24) & 0xff;
  const privateRange = getPrivateRange(ipInt);

  return {
    ip: ipStr,
    prefix,
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(maskInt),
    wildcardMask: intToIp(~maskInt >>> 0),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    totalHosts,
    usableHosts,
    ipClass: getIpClass(firstOctet),
    isPrivate: privateRange !== null,
    privateRange,
  };
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function CidrPage(): React.ReactNode {
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
      setInput(cidr); // eslint-disable-line react-hooks/set-state-in-effect

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

      history.replaceState(null, "", newUrl);
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

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setInput("");
    setInfo(null);
    setError(false);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
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
      >
        <ReferenceLinks
          refs={[
            { name: "DNS Record Types", slug: "dns-record-types" },
            { name: "Port Numbers", slug: "port-numbers" },
          ]}
        />

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
        {error && <Badge color="error">invalid</Badge>}
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
