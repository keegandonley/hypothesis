import { describe, expect, it } from "vitest";
import {
  hexToOklch,
  oklchToHex,
  generateShades,
  isDark,
  STEPS,
  LIGHTNESS,
} from "@/lib/color-shades";

describe("STEPS", () => {
  it("has 11 Tailwind-standard steps", () => {
    expect(STEPS).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
  });
});

describe("LIGHTNESS", () => {
  it("has 11 values", () => {
    expect(LIGHTNESS).toHaveLength(11);
  });
});

describe("hexToOklch", () => {
  it("converts a known hex color", () => {
    const result = hexToOklch("#3b82f6");

    expect(result).not.toBeNull();
    expect(result![0]).toBeGreaterThan(0);
    expect(result![0]).toBeLessThan(1);
    expect(result![1]).toBeGreaterThan(0);
    expect(result![2]).toBeGreaterThanOrEqual(0);
    expect(result![2]).toBeLessThan(360);
  });

  it("returns null for short hex", () => {
    expect(hexToOklch("#fff")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(hexToOklch("")).toBeNull();
  });

  it("strips hash prefix", () => {
    const withHash = hexToOklch("#ff0000");
    const withoutHash = hexToOklch("ff0000");

    expect(withHash).toEqual(withoutHash);
  });

  it("produces reasonable L value for red", () => {
    const result = hexToOklch("#ff0000");

    expect(result![0]).toBeCloseTo(0.63, 1);
  });
});

describe("oklchToHex", () => {
  it("oklchToHex produces a valid 6-digit hex string", () => {
    const result = oklchToHex(0.5, 0.2, 180);

    expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("converts a color through hexToOklch and back to valid hex", () => {
    const original = "#3b82f6";
    const lch = hexToOklch(original);
    const result = oklchToHex(lch![0], lch![1], lch![2]);

    expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe("generateShades", () => {
  it("generates 11 shades for a valid color", () => {
    const shades = generateShades("#3b82f6");

    expect(shades).toHaveLength(11);
  });

  it("has correct step values", () => {
    const shades = generateShades("#3b82f6");

    expect(shades!.map((s) => s.step)).toEqual(STEPS);
  });

  it("returns null for invalid color", () => {
    expect(generateShades("invalid")).toBeNull();
  });
});

describe("isDark", () => {
  it("identifies black as dark", () => {
    expect(isDark("#000000")).toBe(true);
  });

  it("identifies white as not dark", () => {
    expect(isDark("#ffffff")).toBe(false);
  });

  it("identifies red as dark", () => {
    expect(isDark("#ff0000")).toBe(false);
  });

  it("returns false for invalid color", () => {
    expect(isDark("invalid")).toBe(false);
  });
});
