import { describe, expect, it } from "vitest";
import { formatValue, BINARY_UNITS, DECIMAL_UNITS } from "@/lib/bytes";

describe("BINARY_UNITS", () => {
  it("starts with bytes", () => {
    expect(BINARY_UNITS[0].unit).toBe("B");
    expect(BINARY_UNITS[0].factor).toBe(1);
  });

  it("has KiB factor 1024", () => {
    expect(BINARY_UNITS[1].factor).toBe(1024);
  });

  it("has MiB factor 1024^2", () => {
    expect(BINARY_UNITS[2].factor).toBe(1024 ** 2);
  });

  it("has PiB factor 1024^5", () => {
    expect(BINARY_UNITS[5].factor).toBe(1024 ** 5);
  });
});

describe("DECIMAL_UNITS", () => {
  it("starts with bytes", () => {
    expect(DECIMAL_UNITS[0].unit).toBe("B");
    expect(DECIMAL_UNITS[0].factor).toBe(1);
  });

  it("has KB factor 1000", () => {
    expect(DECIMAL_UNITS[1].factor).toBe(1000);
  });

  it("has PB factor 1000^5", () => {
    expect(DECIMAL_UNITS[5].factor).toBe(1000 ** 5);
  });
});

describe("formatValue", () => {
  it("returns '0' for zero bytes", () => {
    expect(formatValue(0, 1)).toBe("0");
  });

  it("formats bytes directly", () => {
    const result = formatValue(1024, 1);

    expect(result.replace(/,/g, "")).toBe("1024");
  });

  it("formats KiB", () => {
    expect(formatValue(1024, 1024)).toBe("1");
  });

  it("formats MiB", () => {
    expect(formatValue(1048576, 1024 ** 2)).toBe("1");
  });

  it("handles fractional values", () => {
    const result = formatValue(1500, 1024);

    expect(result).toContain("1.46");
  });
});
