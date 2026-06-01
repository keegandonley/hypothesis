import { describe, expect, it } from "vitest";
import { fromDecimal, empty } from "@/lib/numbase";

describe("empty", () => {
  it("has empty strings for all bases", () => {
    expect(empty).toEqual({ bin: "", oct: "", dec: "", hex: "" });
  });
});

describe("fromDecimal", () => {
  it("converts 255", () => {
    const result = fromDecimal(255);
    expect(result.bin).toBe("11111111");
    expect(result.oct).toBe("377");
    expect(result.dec).toBe("255");
    expect(result.hex).toBe("FF");
  });

  it("converts 0", () => {
    const result = fromDecimal(0);
    expect(result.bin).toBe("0");
    expect(result.oct).toBe("0");
    expect(result.dec).toBe("0");
    expect(result.hex).toBe("0");
  });

  it("converts 16", () => {
    const result = fromDecimal(16);
    expect(result.bin).toBe("10000");
    expect(result.oct).toBe("20");
    expect(result.hex).toBe("10");
  });

  it("converts 4294967295 (max uint32)", () => {
    const result = fromDecimal(4294967295);
    expect(result.bin).toBe("11111111111111111111111111111111");
    expect(result.hex).toBe("FFFFFFFF");
  });
});
