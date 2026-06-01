import { describe, expect, it } from "vitest";
import { md5, formatBytes, ALGOS, SHA_ALGOS } from "@/lib/hash";

describe("md5", () => {
  it("hashes empty string", () => {
    const result = md5(new Uint8Array(0));
    expect(result).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });

  it("hashes 'hello'", () => {
    const bytes = new TextEncoder().encode("hello");
    expect(md5(bytes)).toBe("5d41402abc4b2a76b9719d911017c592");
  });

  it("hashes 'The quick brown fox jumps over the lazy dog'", () => {
    const bytes = new TextEncoder().encode(
      "The quick brown fox jumps over the lazy dog",
    );
    expect(md5(bytes)).toBe("9e107d9d372bb6826bd81d3542a419d6");
  });

  it("produces 32-character hex string", () => {
    const result = md5(new TextEncoder().encode("test"));
    expect(result).toHaveLength(32);
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats KB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("formats MB", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
  });

  it("formats GB", () => {
    expect(formatBytes(1073741824)).toBe("1.0 GB");
  });

  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
});

describe("ALGOS", () => {
  it("includes MD5 and SHA variants", () => {
    expect(ALGOS[0]).toBe("MD5");
    expect(SHA_ALGOS).toContain("SHA-256");
    expect(SHA_ALGOS).toContain("SHA-512");
  });
});
