import { describe, expect, it } from "vitest";
import { encodeBasicAuth, decodeBasicAuth } from "@/lib/basic-auth";

describe("encodeBasicAuth", () => {
  it("encodes username and password", () => {
    expect(encodeBasicAuth("user", "pass")).toBe("dXNlcjpwYXNz");
  });

  it("encodes empty password", () => {
    expect(encodeBasicAuth("user", "")).toBe("dXNlcjo=");
  });

  it("encodes empty username", () => {
    expect(encodeBasicAuth("", "pass")).toBe("OnBhc3M=");
  });

  it("encodes special characters", () => {
    expect(encodeBasicAuth("user@domain", "p@ss!")).toBe("dXNlckBkb21haW46cEBzcyE=");
  });
});

describe("decodeBasicAuth", () => {
  it("decodes a Basic token", () => {
    expect(decodeBasicAuth("dXNlcjpwYXNz")).toEqual({
      username: "user",
      password: "pass",
    });
  });

  it("strips the Basic prefix", () => {
    expect(decodeBasicAuth("Basic dXNlcjpwYXNz")).toEqual({
      username: "user",
      password: "pass",
    });
  });

  it("is case-insensitive about the Basic prefix", () => {
    expect(decodeBasicAuth("basic dXNlcjpwYXNz")).toEqual({
      username: "user",
      password: "pass",
    });
  });

  it("returns empty password when no colon", () => {
    expect(decodeBasicAuth("dXNlcg==")).toEqual({
      username: "user",
      password: "",
    });
  });

  it("handles colon in password", () => {
    const enc = encodeBasicAuth("user", "pass:word");

    expect(decodeBasicAuth(enc)).toEqual({
      username: "user",
      password: "pass:word",
    });
  });

  it("returns null for empty input", () => {
    expect(decodeBasicAuth("")).toBeNull();
  });

  it("returns null for invalid base64", () => {
    expect(decodeBasicAuth("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for whitespace-only Basic prefix", () => {
    expect(decodeBasicAuth("Basic  ")).toBeNull();
  });
});
