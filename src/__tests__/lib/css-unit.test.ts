import { describe, expect, it } from "vitest";
import {
  convertToPx,
  convertFromPx,
  formatNumber,
  DEFAULT_CONTEXT,
  UNITS,
} from "@/lib/css-unit";

describe("convertToPx", () => {
  it("converts px to px (identity)", () => {
    expect(convertToPx(16, "px", DEFAULT_CONTEXT)).toBe(16);
  });

  it("converts rem to px", () => {
    expect(convertToPx(2, "rem", DEFAULT_CONTEXT)).toBe(32);
  });

  it("converts em to px", () => {
    expect(convertToPx(2, "em", DEFAULT_CONTEXT)).toBe(32);
  });

  it("converts percent to px", () => {
    expect(convertToPx(50, "%", DEFAULT_CONTEXT)).toBe(8);
  });

  it("converts vh to px", () => {
    expect(convertToPx(50, "vh", DEFAULT_CONTEXT)).toBe(540);
  });

  it("converts vw to px", () => {
    expect(convertToPx(50, "vw", DEFAULT_CONTEXT)).toBe(960);
  });

  it("converts pt to px", () => {
    expect(convertToPx(12, "pt", DEFAULT_CONTEXT)).toBeCloseTo(16, 5);
  });

  it("converts cm to px", () => {
    expect(convertToPx(1, "cm", DEFAULT_CONTEXT)).toBeCloseTo(37.795, 2);
  });

  it("converts mm to px", () => {
    expect(convertToPx(10, "mm", DEFAULT_CONTEXT)).toBeCloseTo(37.795, 2);
  });

  it("converts in to px", () => {
    expect(convertToPx(1, "in", DEFAULT_CONTEXT)).toBe(96);
  });
});

describe("convertFromPx", () => {
  it("converts px to px (identity)", () => {
    expect(convertFromPx(16, "px", DEFAULT_CONTEXT)).toBe(16);
  });

  it("converts px to rem", () => {
    expect(convertFromPx(32, "rem", DEFAULT_CONTEXT)).toBe(2);
  });

  it("converts px to percent", () => {
    expect(convertFromPx(8, "%", DEFAULT_CONTEXT)).toBe(50);
  });

  it("round-trips through convertToPx", () => {
    const value = 16;

    for (const unit of UNITS) {
      const px = convertToPx(value, unit, DEFAULT_CONTEXT);
      const back = convertFromPx(px, unit, DEFAULT_CONTEXT);

      expect(back).toBeCloseTo(value, 5);
    }
  });
});

describe("formatNumber", () => {
  it("formats to 3 decimal places", () => {
    expect(formatNumber(16)).toBe("16.000");
    expect(formatNumber(3.14159)).toBe("3.142");
  });
});
