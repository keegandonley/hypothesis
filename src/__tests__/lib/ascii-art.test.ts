import { describe, expect, it } from "vitest";
import { applySharpen, CHAR_SETS } from "@/lib/ascii-art";

describe("CHAR_SETS", () => {
  it("has three character sets", () => {
    expect(Object.keys(CHAR_SETS)).toEqual(["simple", "detailed", "blocks"]);
  });

  it("blocks has 5 characters", () => {
    expect(CHAR_SETS.blocks).toBe(" ░▒▓█");
  });
});

describe("applySharpen", () => {
  it("returns same-length array", () => {
    const data = new Uint8ClampedArray([128, 128, 128, 255]);
    const result = applySharpen(data, 1, 1, 0.5);
    expect(result).toHaveLength(4);
  });

  it("preserves alpha channel", () => {
    const data = new Uint8ClampedArray([100, 100, 100, 200]);
    const result = applySharpen(data, 1, 1, 0.5);
    expect(result[3]).toBe(200);
  });

  it("produces valid pixel values (0-255)", () => {
    const data = new Uint8ClampedArray(16 * 16 * 4);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 255;

    const result = applySharpen(data, 16, 16, 0.5);

    for (let i = 0; i < 3; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0);
      expect(result[i]).toBeLessThanOrEqual(255);
    }
  });

  it("with amount=0 returns original data", () => {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    for (let i = 0; i < data.length; i++) data[i] = 100;

    data[3] = 255;
    data[7] = 255;
    data[11] = 255;
    data[15] = 255;
    const result = applySharpen(data, 4, 4, 0);

    expect([...result]).toEqual([...data]);
  });

  it("handles single pixel image", () => {
    const data = new Uint8ClampedArray([50, 100, 150, 255]);
    const result = applySharpen(data, 1, 1, 1);
    expect(result[0]).toBe(50);
    expect(result[1]).toBe(100);
    expect(result[2]).toBe(150);
  });

  it("sharpens a 2x2 grid", () => {
    const data = new Uint8ClampedArray([
      100, 100, 100, 255, 200, 200, 200, 255,
      50, 50, 50, 255, 150, 150, 150, 255,
    ]);
    const result = applySharpen(data, 2, 2, 1);
    expect(result).toHaveLength(16);
  });
});
