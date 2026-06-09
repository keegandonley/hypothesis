import { describe, expect, it } from "vitest";
import { analyzePassword, formatCrackTime, STRENGTH_LABELS } from "@/lib/password";

describe("analyzePassword", () => {
  it("detects all character types in a complex password", () => {
    const analysis = analyzePassword("Abcd1234!");

    expect(analysis.hasUpper).toBe(true);
    expect(analysis.hasLower).toBe(true);
    expect(analysis.hasDigits).toBe(true);
    expect(analysis.hasSymbols).toBe(true);
  });

  it("reports length correctly", () => {
    const analysis = analyzePassword("abc");

    expect(analysis.length).toBe(3);
  });

  it("classifies 'a' as very-weak", () => {
    const analysis = analyzePassword("a");

    expect(analysis.strength).toBe("very-weak");
  });

  it("classifies a very-strong password", () => {
    const analysis = analyzePassword("CorrectHorseBatteryStaple99!");

    expect(analysis.strength).toBe("very-strong");
  });

  it("classifies a very-strong password", () => {
    const analysis = analyzePassword(
      "Tr0ub4dor&3WithAVeryLongPassphrase!!",
    );

    expect(analysis.strength).toBe("very-strong");
  });

  it("computes entropy > 0 for non-empty passwords", () => {
    const analysis = analyzePassword("hello");

    expect(analysis.entropy).toBeGreaterThan(0);
  });

  it("handles empty string", () => {
    const analysis = analyzePassword("");

    expect(analysis.entropy).toBe(0);
    expect(analysis.length).toBe(0);
    expect(analysis.strength).toBe("very-weak");
  });
});

describe("formatCrackTime", () => {
  it("returns 'instant' for zero entropy", () => {
    expect(formatCrackTime(0)).toBe("instant");
  });

  it("returns 'instant' for negative entropy", () => {
    expect(formatCrackTime(-1)).toBe("instant");
  });

  it("returns time units for various entropies", () => {
    expect(formatCrackTime(30)).toBe("less than a second");
    expect(formatCrackTime(50)).toMatch(/(seconds|minutes|hours)/);
    expect(formatCrackTime(65)).toMatch(/(days|months|years)/);
  });

  it("returns 'effectively uncrackable' for very high entropy", () => {
    expect(formatCrackTime(200)).toBe("effectively uncrackable");
  });
});
