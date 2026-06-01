import { describe, expect, it } from "vitest";
import { parseInput, formatRelative, formatRfc2822, pad } from "@/lib/datetime";

describe("pad", () => {
  it("pads single digit", () => {
    expect(pad(5)).toBe("05");
  });

  it("does not pad double digit", () => {
    expect(pad(10)).toBe("10");
  });

  it("respects custom digits", () => {
    expect(pad(5, 3)).toBe("005");
  });
});

describe("formatRelative", () => {
  it("formats past times", () => {
    const past = new Date(Date.now() - 60000);
    expect(formatRelative(past)).toMatch(/\d+ minute/);
  });

  it("formats future times", () => {
    const future = new Date(Date.now() + 60000);
    expect(formatRelative(future)).toMatch(/in \d+ minute/);
  });
});

describe("formatRfc2822", () => {
  it("formats a known date", () => {
    const d = new Date("2024-01-15T12:30:00Z");
    expect(formatRfc2822(d)).toBe(
      "Mon, 15 Jan 2024 12:30:00 +0000",
    );
  });
});

describe("parseInput", () => {
  it("parses unix milliseconds", () => {
    const input = String(Date.now());
    expect(parseInput(input)).not.toBeNull();
  });

  it("parses unix seconds (10-digit)", () => {
    const result = parseInput("1705312200");
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBe(1705312200 * 1000);
  });

  it("parses ISO 8601 string", () => {
    const result = parseInput("2024-01-15T12:30:00Z");
    expect(result).not.toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseInput("")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseInput("not a date")).toBeNull();
  });
});
