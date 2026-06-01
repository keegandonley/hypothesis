import { describe, expect, it } from "vitest";
import { computeResults, getPatternStatus, flagTitle, FLAGS } from "@/lib/regex";

describe("computeResults", () => {
  it("returns empty array for empty pattern", () => {
    expect(computeResults("", "g", "test")).toEqual([]);
  });

  it("finds all matches in single-line input", () => {
    const results = computeResults("\\d+", "g", "abc 123 def 456");
    expect(results).toHaveLength(1);
    expect(results[0].matchCount).toBe(2);
  });

  it("captures groups", () => {
    const results = computeResults("(\\w+) (\\d+)", "g", "abc 123");
    expect(results[0].groups).toContain("abc");
    expect(results[0].groups).toContain("123");
  });

  it("returns empty array for invalid pattern", () => {
    expect(computeResults("[invalid", "g", "test")).toEqual([]);
  });

  it("handles empty test input", () => {
    const results = computeResults("\\w+", "g", "");
    expect(results).toHaveLength(1);
    expect(results[0].input).toBe("");
    expect(results[0].matched).toBe(false);
  });

  it("uses global flag regardless of input flags", () => {
    const results = computeResults("a", "", "aaa");
    expect(results[0].matchCount).toBe(3);
  });
});

describe("getPatternStatus", () => {
  it("returns ready for empty pattern", () => {
    const status = getPatternStatus("", "g", []);
    expect(status.type).toBe("badgeReady");
  });

  it("returns error for invalid pattern", () => {
    const status = getPatternStatus("[invalid", "g", []);
    expect(status.type).toBe("badgeError");
    expect(status.label).toContain("error:");
  });

  it("returns valid for valid pattern with no test input", () => {
    const status = getPatternStatus("\\d+", "g", [{ input: "", matched: false, matchCount: 0, groups: [] }]);
    expect(status.type).toBe("badge");
    expect(status.label).toBe("valid");
  });

  it("shows match count", () => {
    const results = computeResults("\\d+", "g", "abc 123");
    const status = getPatternStatus("\\d+", "g", results);
    expect(status.type).toBe("badge");
    expect(status.label).toMatch(/\d+\/\d+ match/);
  });
});

describe("flagTitle", () => {
  it("returns description for each flag", () => {
    for (const flag of FLAGS) {
      expect(flagTitle(flag)).toBeDefined();
      expect(typeof flagTitle(flag)).toBe("string");
    }
  });
});
