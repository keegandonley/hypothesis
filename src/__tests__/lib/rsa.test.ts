import { describe, expect, it } from "vitest";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  wrapPem,
  parsePemBody,
} from "@/lib/rsa";

describe("arrayBufferToBase64", () => {
  it("encodes an ArrayBuffer", () => {
    const buf = new Uint8Array([104, 101, 108, 108, 111]).buffer;
    expect(arrayBufferToBase64(buf)).toBe("aGVsbG8=");
  });

  it("encodes empty buffer", () => {
    expect(arrayBufferToBase64(new ArrayBuffer(0))).toBe("");
  });
});

describe("base64ToArrayBuffer", () => {
  it("decodes base64 string", () => {
    const buf = base64ToArrayBuffer("aGVsbG8=");
    const bytes = new Uint8Array(buf);
    expect([...bytes]).toEqual([104, 101, 108, 108, 111]);
  });

  it("round-trips through arrayBufferToBase64", () => {
    const original = new Uint8Array([1, 2, 3, 255, 128, 64]).buffer;
    const b64 = arrayBufferToBase64(original);
    const decoded = base64ToArrayBuffer(b64);
    const decodedBytes = new Uint8Array(decoded);
    expect([...decodedBytes]).toEqual([1, 2, 3, 255, 128, 64]);
  });
});

describe("wrapPem", () => {
  it("wraps base64 in PEM format", () => {
    const pem = wrapPem("aGVsbG8=", "PUBLIC KEY");
    expect(pem).toContain("-----BEGIN PUBLIC KEY-----");
    expect(pem).toContain("-----END PUBLIC KEY-----");
    expect(pem).toContain("\n");
  });

  it("wraps lines at 64 characters", () => {
    const long = "a".repeat(200);
    const pem = wrapPem(long, "PRIVATE KEY");
    const lines = pem.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(5);
    expect(lines.every((l) => l.startsWith("-----") || l.length <= 64)).toBe(true);
  });

  it("handles empty input", () => {
    const pem = wrapPem("", "CERTIFICATE");
    expect(pem).toBe("-----BEGIN CERTIFICATE-----\n\n-----END CERTIFICATE-----");
  });
});

describe("parsePemBody", () => {
  it("extracts base64 body from PEM", () => {
    const pem = `-----BEGIN PUBLIC KEY-----\naGVsbG8=\n-----END PUBLIC KEY-----`;
    const buf = parsePemBody(pem);
    expect(buf).not.toBeNull();
    const bytes = new Uint8Array(buf!);
    expect([...bytes]).toEqual([104, 101, 108, 108, 111]);
  });

  it("returns null for empty PEM", () => {
    expect(parsePemBody("")).toBeNull();
  });

  it("returns null for invalid base64", () => {
    expect(parsePemBody("-----BEGIN KEY-----\n!!!\n-----END KEY-----")).toBeNull();
  });

  it("handles PEM without headers", () => {
    const buf = parsePemBody("aGVsbG8=");
    expect(buf).not.toBeNull();
  });
});
