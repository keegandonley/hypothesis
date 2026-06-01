export type ECLevel = "L" | "M" | "Q" | "H";
export type QrMode = "text" | "wifi" | "vcard";
export type WifiSecurity = "WPA" | "WEP" | "nopass";

export const EC_LEVELS: ECLevel[] = ["L", "M", "Q", "H"];
export const EC_DESCRIPTIONS: Record<ECLevel, string> = {
  L: "~7% correction",
  M: "~15% correction",
  Q: "~25% correction",
  H: "~30% correction",
};

export interface WifiState {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}

export interface VCardState {
  first: string;
  last: string;
  phone: string;
  email: string;
  org: string;
  url: string;
}

export const EMPTY_WIFI: WifiState = {
  ssid: "",
  password: "",
  security: "WPA",
  hidden: false,
};

export const EMPTY_VCARD: VCardState = {
  first: "",
  last: "",
  phone: "",
  email: "",
  org: "",
  url: "",
};

export function escapeWifi(s: string): string {
  return s.replace(/([\\;,"])/g, "\\$1");
}

export function buildWifiString(w: WifiState): string {
  if (!w.ssid) return "";
  const p =
    w.security !== "nopass" && w.password
      ? `P:${escapeWifi(w.password)};`
      : "";

  return `WIFI:T:${w.security};S:${escapeWifi(w.ssid)};${p}H:${w.hidden};;`;
}

export function buildVCardString(v: VCardState): string {
  const fn = [v.first, v.last].filter(Boolean).join(" ");

  if (!fn && !v.phone && !v.email && !v.org && !v.url) return "";
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  if (fn) {
    lines.push(`FN:${fn}`);
    lines.push(`N:${v.last};${v.first};;;`);
  }

  if (v.phone) lines.push(`TEL;TYPE=CELL:${v.phone}`);
  if (v.email) lines.push(`EMAIL:${v.email}`);
  if (v.org) lines.push(`ORG:${v.org}`);
  if (v.url) lines.push(`URL:${v.url}`);
  lines.push("END:VCARD");

  return lines.join("\n");
}

export function getQrString(
  mode: QrMode,
  text: string,
  wifi: WifiState,
  vcard: VCardState,
): string {
  if (mode === "text") return text;
  if (mode === "wifi") return buildWifiString(wifi);

  return buildVCardString(vcard);
}
