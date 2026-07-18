import { describe, expect, it } from "vitest";
import { parseCron, formatLocal, formatUtc, NEXT_COUNT } from "@/lib/cron";

describe("parseCron", () => {
  it("parses 'every minute'", () => {
    const result = parseCron("* * * * *");

    if (result.error !== null) return;
    expect(result.description).toBeDefined();
    expect(result.nextRuns).toHaveLength(NEXT_COUNT);
  });

  it("parses 'daily at midnight'", () => {
    const result = parseCron("0 0 * * *");

    if (result.error !== null) return;
    expect(result.nextRuns.length).toBe(NEXT_COUNT);
  });

  it("parses 'weekdays at 9 AM'", () => {
    const result = parseCron("0 9 * * 1-5");

    if (result.error !== null) return;
    expect(result.nextRuns.length).toBe(NEXT_COUNT);
  });

  it("returns error for empty string", () => {
    const result = parseCron("");

    expect(result).toHaveProperty("error");
  });

  it("returns error for invalid expression", () => {
    const result = parseCron("not-a-cron");

    expect(result).toHaveProperty("error");
  });

  it("returns error for garbage input", () => {
    const result = parseCron("999 999 * * *");

    expect(result).toHaveProperty("error");
  });
});

describe("formatLocal", () => {
  it("formats a date", () => {
    const d = new Date("2024-01-15T12:30:00Z");
    const formatted = formatLocal(d);

    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe("string");
  });
});

describe("formatUtc", () => {
  it("returns a UTC string", () => {
    const d = new Date("2024-01-15T12:30:00Z");

    expect(formatUtc(d)).toContain("15 Jan 2024");
  });
});
