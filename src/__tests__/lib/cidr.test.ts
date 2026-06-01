import { describe, expect, it } from "vitest";
import {
  intToIp,
  ipToInt,
  isValidIp,
  getIpClass,
  getPrivateRange,
  parseCidr,
  formatNumber,
} from "@/lib/cidr";

describe("intToIp", () => {
  it("converts 0 to 0.0.0.0", () => {
    expect(intToIp(0)).toBe("0.0.0.0");
  });

  it("converts 2130706433 to 127.0.0.1", () => {
    expect(intToIp(2130706433)).toBe("127.0.0.1");
  });

  it("converts 3232235777 to 192.168.1.1", () => {
    expect(intToIp(3232235777)).toBe("192.168.1.1");
  });

  it("converts 4294967295 to 255.255.255.255", () => {
    expect(intToIp(4294967295)).toBe("255.255.255.255");
  });
});

describe("ipToInt", () => {
  it("converts 0.0.0.0 to 0", () => {
    expect(ipToInt("0.0.0.0")).toBe(0);
  });

  it("converts 127.0.0.1 to 2130706433", () => {
    expect(ipToInt("127.0.0.1")).toBe(2130706433);
  });

  it("converts 192.168.1.1 to 3232235777", () => {
    expect(ipToInt("192.168.1.1")).toBe(3232235777);
  });

  it("converts 255.255.255.255 to 4294967295", () => {
    expect(ipToInt("255.255.255.255")).toBe(4294967295);
  });
});

describe("isValidIp", () => {
  it("accepts 192.168.1.1", () => {
    expect(isValidIp("192.168.1.1")).toBe(true);
  });

  it("accepts 0.0.0.0", () => {
    expect(isValidIp("0.0.0.0")).toBe(true);
  });

  it("accepts 255.255.255.255", () => {
    expect(isValidIp("255.255.255.255")).toBe(true);
  });

  it("rejects 256.0.0.0", () => {
    expect(isValidIp("256.0.0.0")).toBe(false);
  });

  it("rejects negative octet", () => {
    expect(isValidIp("-1.0.0.0")).toBe(false);
  });

  it("rejects non-numeric octet", () => {
    expect(isValidIp("abc.0.0.0")).toBe(false);
  });

  it("rejects too few octets", () => {
    expect(isValidIp("192.168.1")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidIp("")).toBe(false);
  });

  it("rejects leading zeros that differ from canonical form", () => {
    expect(isValidIp("192.168.01.1")).toBe(false);
  });
});

describe("getIpClass", () => {
  it("returns A for 0-127", () => {
    expect(getIpClass(0)).toBe("A");
    expect(getIpClass(10)).toBe("A");
    expect(getIpClass(127)).toBe("A");
  });

  it("returns B for 128-191", () => {
    expect(getIpClass(128)).toBe("B");
    expect(getIpClass(172)).toBe("B");
    expect(getIpClass(191)).toBe("B");
  });

  it("returns C for 192-223", () => {
    expect(getIpClass(192)).toBe("C");
    expect(getIpClass(224)).toBe("D (Multicast)");
  });

  it("returns E for 240+", () => {
    expect(getIpClass(240)).toBe("E (Reserved)");
    expect(getIpClass(255)).toBe("E (Reserved)");
  });
});

describe("getPrivateRange", () => {
  it("detects 10.x.x.x", () => {
    expect(getPrivateRange(ipToInt("10.0.0.1"))).toBe("10.0.0.0/8");
  });

  it("detects 172.16.x.x", () => {
    expect(getPrivateRange(ipToInt("172.16.0.1"))).toBe("172.16.0.0/12");
    expect(getPrivateRange(ipToInt("172.31.0.1"))).toBe("172.16.0.0/12");
  });

  it("detects 192.168.x.x", () => {
    expect(getPrivateRange(ipToInt("192.168.0.1"))).toBe("192.168.0.0/16");
  });

  it("detects 127.x.x.x as loopback", () => {
    expect(getPrivateRange(ipToInt("127.0.0.1"))).toBe("127.0.0.0/8 (Loopback)");
  });

  it("returns null for public IPs", () => {
    expect(getPrivateRange(ipToInt("8.8.8.8"))).toBeNull();
  });
});

describe("parseCidr", () => {
  it("parses 192.168.1.0/24", () => {
    const result = parseCidr("192.168.1.0/24")!;
    expect(result.networkAddress).toBe("192.168.1.0");
    expect(result.broadcastAddress).toBe("192.168.1.255");
    expect(result.subnetMask).toBe("255.255.255.0");
    expect(result.firstHost).toBe("192.168.1.1");
    expect(result.lastHost).toBe("192.168.1.254");
    expect(result.totalHosts).toBe(256);
    expect(result.usableHosts).toBe(254);
    expect(result.prefix).toBe(24);
  });

  it("parses 10.0.0.0/8", () => {
    const result = parseCidr("10.0.0.0/8")!;
    expect(result.networkAddress).toBe("10.0.0.0");
    expect(result.broadcastAddress).toBe("10.255.255.255");
    expect(result.ipClass).toBe("A");
    expect(result.isPrivate).toBe(true);
  });

  it("parses a single IP /32", () => {
    const result = parseCidr("192.168.1.1/32")!;
    expect(result.networkAddress).toBe("192.168.1.1");
    expect(result.broadcastAddress).toBe("192.168.1.1");
    expect(result.usableHosts).toBe(1);
    expect(result.firstHost).toBe("192.168.1.1");
    expect(result.lastHost).toBe("192.168.1.1");
  });

  it("parses /31 with no network/broadcast distinction for hosts", () => {
    const result = parseCidr("10.0.0.0/31")!;
    expect(result.usableHosts).toBe(2);
    expect(result.firstHost).toBe("10.0.0.0");
    expect(result.lastHost).toBe("10.0.0.1");
  });

  it("parses /0 as full range", () => {
    const result = parseCidr("0.0.0.0/0")!;
    expect(result.totalHosts).toBe(4294967296);
    expect(result.networkAddress).toBe("0.0.0.0");
    expect(result.broadcastAddress).toBe("255.255.255.255");
  });

  it("handles bare IP without prefix as /32", () => {
    const result = parseCidr("8.8.8.8")!;
    expect(result.prefix).toBe(32);
    expect(result.usableHosts).toBe(1);
  });

  it("returns null for invalid IP", () => {
    expect(parseCidr("999.999.999.999/24")).toBeNull();
  });

  it("returns null for invalid prefix", () => {
    expect(parseCidr("192.168.1.0/33")).toBeNull();
    expect(parseCidr("192.168.1.0/-1")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseCidr("")).toBeNull();
  });

  it("computes wildcard mask correctly", () => {
    const result = parseCidr("192.168.1.0/24")!;
    expect(result.wildcardMask).toBe("0.0.0.255");
  });
});

describe("formatNumber", () => {
  it("formats with locale separators", () => {
    const val = formatNumber(4294967296);
    expect(val).toBeDefined();
    expect(typeof val).toBe("string");
  });
});
