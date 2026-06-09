import { describe, expect, it } from "vitest";
import {
  base64urlDecode,
  base64urlEncode,
  decodeJwt,
  getExpiryStatus,
} from "@/lib/jwt";

describe("base64urlEncode / base64urlDecode", () => {
  it("round-trips a string", () => {
    const original = '{"alg":"HS256"}';

    expect(base64urlDecode(base64urlEncode(original))).toBe(original);
  });

  it("produces URL-safe base64 (no + / =)", () => {
    const encoded = base64urlEncode("hello?world=test");

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });
});

describe("decodeJwt", () => {
  it("decodes a valid JWT", () => {
    const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64urlEncode(
      JSON.stringify({ sub: "123", name: "test" }),
    );
    const token = `${header}.${payload}.fakesignature`;

    const result = decodeJwt(token);

    expect(result).not.toBeNull();
    expect(result!.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result!.payload).toEqual({ sub: "123", name: "test" });
    expect(result!.signature).toBe("fakesignature");
  });

  it("returns null for malformed token (wrong parts count)", () => {
    expect(decodeJwt("only.two")).toBeNull();
  });

  it("returns null for non-JSON header", () => {
    expect(decodeJwt("not-json.payload.signature")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(decodeJwt("")).toBeNull();
  });
});

describe("getExpiryStatus", () => {
  it("returns 'no-exp' when payload has no exp", () => {
    expect(getExpiryStatus({ sub: "123" })).toBe("no-exp");
  });

  it("returns 'no-exp' for null payload", () => {
    expect(getExpiryStatus(null)).toBe("no-exp");
  });

  it("returns 'valid' for future expiry", () => {
    const future = Date.now() / 1000 + 3600;

    expect(getExpiryStatus({ exp: future })).toBe("valid");
  });

  it("returns 'expired' for past expiry", () => {
    expect(getExpiryStatus({ exp: 0 })).toBe("expired");
  });
});
