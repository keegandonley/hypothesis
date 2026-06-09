import { describe, expect, it } from "vitest";
import {
  escapeWifi,
  buildWifiString,
  buildVCardString,
  getQrString,
  EC_LEVELS,
  EMPTY_WIFI,
  EMPTY_VCARD,
} from "@/lib/qr";

describe("escapeWifi", () => {
  it("escapes backslash", () => {
    expect(escapeWifi("a\\b")).toBe("a\\\\b");
  });

  it("escapes semicolon", () => {
    expect(escapeWifi("a;b")).toBe("a\\;b");
  });

  it("escapes comma", () => {
    expect(escapeWifi("a,b")).toBe("a\\,b");
  });

  it("escapes double quote", () => {
    expect(escapeWifi('a"b')).toBe('a\\"b');
  });

  it("leaves normal text unchanged", () => {
    expect(escapeWifi("hello")).toBe("hello");
  });
});

describe("buildWifiString", () => {
  it("builds WPA string", () => {
    const result = buildWifiString({
      ssid: "MyNetwork",
      password: "secret123",
      security: "WPA",
      hidden: false,
    });

    expect(result).toContain("WIFI:T:WPA;");
    expect(result).toContain("S:MyNetwork;");
    expect(result).toContain("P:secret123;");
    expect(result).toContain("H:false");
  });

  it("omits password for nopass", () => {
    const result = buildWifiString({
      ssid: "OpenNet",
      password: "",
      security: "nopass",
      hidden: false,
    });

    expect(result).not.toContain("P:");
    expect(result).toContain("T:nopass");
  });

  it("returns empty for empty SSID", () => {
    expect(buildWifiString(EMPTY_WIFI)).toBe("");
  });

  it("escapes special chars in SSID", () => {
    const result = buildWifiString({
      ssid: 'Net;work',
      password: "",
      security: "WPA",
      hidden: false,
    });

    expect(result).toContain("S:Net\\;work");
  });
});

describe("buildVCardString", () => {
  it("builds a vCard with all fields", () => {
    const result = buildVCardString({
      first: "Jane",
      last: "Doe",
      phone: "+1555000000",
      email: "jane@example.com",
      org: "Acme",
      url: "https://example.com",
    });

    expect(result).toContain("BEGIN:VCARD");
    expect(result).toContain("VERSION:3.0");
    expect(result).toContain("FN:Jane Doe");
    expect(result).toContain("N:Doe;Jane;;;");
    expect(result).toContain("TEL;TYPE=CELL:+1555000000");
    expect(result).toContain("EMAIL:jane@example.com");
    expect(result).toContain("ORG:Acme");
    expect(result).toContain("URL:https://example.com");
    expect(result).toContain("END:VCARD");
  });

  it("builds a minimal vCard with just a name", () => {
    const result = buildVCardString({
      first: "Jane",
      last: "Doe",
      phone: "",
      email: "",
      org: "",
      url: "",
    });

    expect(result).toContain("FN:Jane Doe");
    expect(result).not.toContain("TEL;");
  });

  it("returns empty for all-empty input", () => {
    expect(buildVCardString(EMPTY_VCARD)).toBe("");
  });

  it("handles missing first name", () => {
    const result = buildVCardString({
      first: "",
      last: "Doe",
      phone: "",
      email: "",
      org: "",
      url: "",
    });

    expect(result).toContain("FN:Doe");
    expect(result).toContain("N:Doe;;;");
  });
});

describe("getQrString", () => {
  it("returns text for text mode", () => {
    expect(getQrString("text", "hello", EMPTY_WIFI, EMPTY_VCARD)).toBe("hello");
  });

  it("returns wifi string for wifi mode", () => {
    const wifi = { ...EMPTY_WIFI, ssid: "Net" };
    const result = getQrString("wifi", "", wifi, EMPTY_VCARD);

    expect(result).toContain("WIFI:");
  });

  it("returns vcard string for vcard mode", () => {
    const vcard = { ...EMPTY_VCARD, first: "Jane", last: "Doe" };
    const result = getQrString("vcard", "", EMPTY_WIFI, vcard);

    expect(result).toContain("BEGIN:VCARD");
  });
});

describe("EC_LEVELS", () => {
  it("has 4 error correction levels", () => {
    expect(EC_LEVELS).toEqual(["L", "M", "Q", "H"]);
  });
});
