export interface CidrInfo {
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

export function intToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

export function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);

  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

export function isValidIp(ip: string): boolean {
  const parts = ip.split(".");

  if (parts.length !== 4) return false;

  return parts.every((p) => {
    const n = parseInt(p, 10);

    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

export function getIpClass(firstOctet: number): string {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (Multicast)";

  return "E (Reserved)";
}

export function getPrivateRange(ipInt: number): string | null {
  const a = (ipInt >>> 24) & 0xff;
  const b = (ipInt >>> 16) & 0xff;

  if (a === 10) return "10.0.0.0/8";
  if (a === 172 && b >= 16 && b <= 31) return "172.16.0.0/12";
  if (a === 192 && b === 168) return "192.168.0.0/16";
  if (a === 127) return "127.0.0.0/8 (Loopback)";

  return null;
}

export function parseCidr(input: string): CidrInfo | null {
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

export function formatNumber(n: number): string {
  return n.toLocaleString();
}
