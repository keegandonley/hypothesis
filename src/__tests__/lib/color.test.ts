import { describe, expect, it } from "vitest";

import {
  clamp,
  delinearize,
  formatColor,
  hslToRgb,
  linearize,
  linearRgbToXyz,
  oklabToXyz,
  parseColor,
  parseHex,
  parseHSL,
  parseOKLCH,
  parseRGB,
  rgbToHsl,
  rgbaToOklch,
  toHex6,
  toHex8,
  toHSL,
  toOKLCH,
  toRGB,
  toRGBA,
  xyzToLinearRgb,
  xyzToOklab,
} from "@/lib/color";

// ---------------------------------------------------------------------------
// clamp
// ---------------------------------------------------------------------------

describe("clamp", () => {
  it("returns the value when within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to lo", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("clamps to hi", () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("accepts boundary values unchanged", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// parseHex
// ---------------------------------------------------------------------------

describe("parseHex", () => {
  it("parses a 6-digit hex with #", () => {
    expect(parseHex("#ff0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("parses a 6-digit hex without #", () => {
    expect(parseHex("ff0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("is case-insensitive", () => {
    expect(parseHex("#FF0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("parses black", () => {
    expect(parseHex("#000000")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it("parses white", () => {
    expect(parseHex("#ffffff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("parses an 8-digit hex with alpha", () => {
    const result = parseHex("#ff000080")!;
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.a).toBeCloseTo(128 / 255, 5);
  });

  it("returns full alpha for 8-digit hex ending in ff", () => {
    const result = parseHex("#ff0000ff")!;
    expect(result.a).toBeCloseTo(1, 5);
  });

  it("returns null for a 3-digit short hex (not supported)", () => {
    expect(parseHex("#abc")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseHex("not-a-color")).toBeNull();
    expect(parseHex("")).toBeNull();
    expect(parseHex("#gg0000")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseRGB
// ---------------------------------------------------------------------------

describe("parseRGB", () => {
  it("parses rgb()", () => {
    expect(parseRGB("rgb(255, 0, 0)")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("parses rgba() with alpha", () => {
    expect(parseRGB("rgba(255, 0, 0, 0.5)")).toEqual({
      r: 255,
      g: 0,
      b: 0,
      a: 0.5,
    });
  });

  it("clamps channel values above 255", () => {
    expect(parseRGB("rgb(300, 0, 0)")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("returns null for negative channel values (regex does not match '-')", () => {
    expect(parseRGB("rgb(-10, 0, 0)")).toBeNull();
  });

  it("clamps alpha above 1", () => {
    const result = parseRGB("rgba(0, 0, 0, 2)")!;
    expect(result.a).toBe(1);
  });

  it("rounds fractional channel values", () => {
    expect(parseRGB("rgb(254.6, 0, 0)")!.r).toBe(255);
  });

  it("returns null for invalid input", () => {
    expect(parseRGB("not-rgb")).toBeNull();
    expect(parseRGB("hsl(0, 100%, 50%)")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hslToRgb
// ---------------------------------------------------------------------------

describe("hslToRgb", () => {
  it("converts red (0°, 100%, 50%)", () => {
    expect(hslToRgb(0, 100, 50)).toEqual([255, 0, 0]);
  });

  it("converts green (120°, 100%, 50%)", () => {
    expect(hslToRgb(120, 100, 50)).toEqual([0, 255, 0]);
  });

  it("converts blue (240°, 100%, 50%)", () => {
    expect(hslToRgb(240, 100, 50)).toEqual([0, 0, 255]);
  });

  it("converts white (0°, 0%, 100%)", () => {
    expect(hslToRgb(0, 0, 100)).toEqual([255, 255, 255]);
  });

  it("converts black (0°, 0%, 0%)", () => {
    expect(hslToRgb(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it("converts mid-gray (0°, 0%, 50%)", () => {
    const [r, g, b] = hslToRgb(0, 0, 50);
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(r).toBeCloseTo(128, -1);
  });
});

// ---------------------------------------------------------------------------
// parseHSL
// ---------------------------------------------------------------------------

describe("parseHSL", () => {
  it("parses hsl()", () => {
    expect(parseHSL("hsl(0, 100%, 50%)")).toEqual({
      r: 255,
      g: 0,
      b: 0,
      a: 1,
    });
  });

  it("parses hsla() with alpha", () => {
    expect(parseHSL("hsla(0, 100%, 50%, 0.5)")).toMatchObject({
      r: 255,
      g: 0,
      b: 0,
      a: 0.5,
    });
  });

  it("parses green", () => {
    expect(parseHSL("hsl(120, 100%, 50%)")).toEqual({
      r: 0,
      g: 255,
      b: 0,
      a: 1,
    });
  });

  it("parses blue", () => {
    expect(parseHSL("hsl(240, 100%, 50%)")).toEqual({
      r: 0,
      g: 0,
      b: 255,
      a: 1,
    });
  });

  it("wraps hue values ≥ 360", () => {
    // 360° = 0° = red
    const result = parseHSL("hsl(360, 100%, 50%)")!;
    expect(result.r).toBe(255);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
  });

  it("returns null for invalid input", () => {
    expect(parseHSL("rgb(255,0,0)")).toBeNull();
    expect(parseHSL("not-hsl")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// linearize / delinearize
// ---------------------------------------------------------------------------

describe("linearize", () => {
  it("linearize(0) = 0", () => {
    expect(linearize(0)).toBeCloseTo(0, 10);
  });

  it("linearize(255) ≈ 1", () => {
    expect(linearize(255)).toBeCloseTo(1, 5);
  });

  it("uses the linear segment for small values", () => {
    // c/255 = 10/255 ≈ 0.039, which is ≤ 0.04045 → linear segment
    expect(linearize(10)).toBeCloseTo(10 / 255 / 12.92, 8);
  });

  it("uses the gamma segment for larger values", () => {
    const cn = 128 / 255;
    const expected = Math.pow((cn + 0.055) / 1.055, 2.4);
    expect(linearize(128)).toBeCloseTo(expected, 8);
  });
});

describe("delinearize", () => {
  it("delinearize(0) = 0", () => {
    expect(delinearize(0)).toBe(0);
  });

  it("delinearize(1) = 255", () => {
    expect(delinearize(1)).toBe(255);
  });

  it("clamps values above 1", () => {
    expect(delinearize(2)).toBe(255);
  });

  it("clamps values below 0", () => {
    expect(delinearize(-0.5)).toBe(0);
  });

  it("round-trips with linearize within ±1 LSB", () => {
    for (const v of [0, 1, 64, 127, 128, 200, 255]) {
      expect(delinearize(linearize(v))).toBeCloseTo(v, -1);
    }
  });
});

// ---------------------------------------------------------------------------
// linearRgbToXyz / xyzToLinearRgb round-trip
// ---------------------------------------------------------------------------

describe("linearRgbToXyz / xyzToLinearRgb", () => {
  it("black maps to XYZ origin", () => {
    expect(linearRgbToXyz(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it("round-trips back to linear RGB within float tolerance", () => {
    const cases: [number, number, number][] = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [0.5, 0.5, 0.5],
      [0.2, 0.6, 0.9],
    ];
    for (const [r, g, b] of cases) {
      const [x, y, z] = linearRgbToXyz(r, g, b);
      const [rr, gg, bb] = xyzToLinearRgb(x, y, z);
      expect(rr).toBeCloseTo(r, 5);
      expect(gg).toBeCloseTo(g, 5);
      expect(bb).toBeCloseTo(b, 5);
    }
  });
});

// ---------------------------------------------------------------------------
// xyzToOklab / oklabToXyz round-trip
// ---------------------------------------------------------------------------

describe("xyzToOklab / oklabToXyz", () => {
  it("round-trips XYZ through OKLab within float tolerance", () => {
    const cases: [number, number, number][] = [
      [0.95, 1.0, 1.09], // D65 white
      [0.2, 0.1, 0.05],
      [0.0, 0.0, 0.0],
    ];
    for (const [x, y, z] of cases) {
      const [L, a, b] = xyzToOklab(x, y, z);
      const [xr, yr, zr] = oklabToXyz(L, a, b);
      expect(xr).toBeCloseTo(x, 5);
      expect(yr).toBeCloseTo(y, 5);
      expect(zr).toBeCloseTo(z, 5);
    }
  });
});

// ---------------------------------------------------------------------------
// rgbaToOklch
// ---------------------------------------------------------------------------

describe("rgbaToOklch", () => {
  it("black has near-zero L and C", () => {
    const [L, C] = rgbaToOklch({ r: 0, g: 0, b: 0, a: 1 });
    expect(L).toBeCloseTo(0, 4);
    expect(C).toBeCloseTo(0, 4);
  });

  it("white has L ≈ 1 and near-zero C", () => {
    const [L, C] = rgbaToOklch({ r: 255, g: 255, b: 255, a: 1 });
    expect(L).toBeCloseTo(1, 3);
    expect(C).toBeCloseTo(0, 3);
  });

  it("red has a hue near 29°", () => {
    const [, , H] = rgbaToOklch({ r: 255, g: 0, b: 0, a: 1 });
    expect(H).toBeCloseTo(29.23, 0);
  });

  it("hue is always in [0, 360)", () => {
    const colors = [
      { r: 255, g: 0, b: 0, a: 1 },
      { r: 0, g: 255, b: 0, a: 1 },
      { r: 0, g: 0, b: 255, a: 1 },
      { r: 128, g: 64, b: 200, a: 1 },
    ];
    for (const c of colors) {
      const [, , H] = rgbaToOklch(c);
      expect(H).toBeGreaterThanOrEqual(0);
      expect(H).toBeLessThan(360);
    }
  });
});

// ---------------------------------------------------------------------------
// parseOKLCH
// ---------------------------------------------------------------------------

describe("parseOKLCH", () => {
  it("round-trips a known value through toOKLCH → parseOKLCH", () => {
    const original = { r: 126, g: 200, b: 80, a: 1 };
    const str = toOKLCH(original);
    const parsed = parseOKLCH(str)!;
    expect(parsed.r).toBeCloseTo(original.r, -1);
    expect(parsed.g).toBeCloseTo(original.g, -1);
    expect(parsed.b).toBeCloseTo(original.b, -1);
  });

  it("parses oklch() with alpha channel", () => {
    const original = { r: 200, g: 100, b: 50, a: 0.7 };
    const str = toOKLCH(original);
    const parsed = parseOKLCH(str)!;
    expect(parsed.a).toBeCloseTo(0.7, 5);
  });

  it("returns null for invalid input", () => {
    expect(parseOKLCH("rgb(255,0,0)")).toBeNull();
    expect(parseOKLCH("not-oklch")).toBeNull();
    expect(parseOKLCH("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseColor dispatcher
// ---------------------------------------------------------------------------

describe("parseColor", () => {
  it("returns null for empty string", () => {
    expect(parseColor("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseColor("   ")).toBeNull();
  });

  it("returns null for unrecognised input", () => {
    expect(parseColor("banana")).toBeNull();
  });

  it("dispatches to parseHex for # input", () => {
    expect(parseColor("#ff0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it("dispatches to parseRGB for rgb() input", () => {
    expect(parseColor("rgb(0, 255, 0)")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
  });

  it("dispatches to parseHSL for hsl() input", () => {
    const result = parseColor("hsl(240, 100%, 50%)")!;
    expect(result.b).toBe(255);
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
  });

  it("dispatches to parseOKLCH for oklch() input", () => {
    const result = parseColor("oklch(0.5 0.1 180)");
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// toHex6 / toHex8
// ---------------------------------------------------------------------------

describe("toHex6", () => {
  it("formats red", () => {
    expect(toHex6({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
  });

  it("formats black", () => {
    expect(toHex6({ r: 0, g: 0, b: 0, a: 1 })).toBe("#000000");
  });

  it("formats white", () => {
    expect(toHex6({ r: 255, g: 255, b: 255, a: 1 })).toBe("#ffffff");
  });

  it("pads single-digit hex channels", () => {
    expect(toHex6({ r: 1, g: 2, b: 3, a: 1 })).toBe("#010203");
  });
});

describe("toHex8", () => {
  it("appends ff for fully opaque", () => {
    expect(toHex8({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000ff");
  });

  it("appends 00 for fully transparent", () => {
    expect(toHex8({ r: 255, g: 0, b: 0, a: 0 })).toBe("#ff000000");
  });

  it("appends 80 for alpha ≈ 0.502 (128/255)", () => {
    expect(toHex8({ r: 255, g: 0, b: 0, a: 128 / 255 })).toBe("#ff000080");
  });
});

// ---------------------------------------------------------------------------
// toRGB / toRGBA
// ---------------------------------------------------------------------------

describe("toRGB", () => {
  it("formats correctly", () => {
    expect(toRGB({ r: 10, g: 20, b: 30, a: 1 })).toBe("rgb(10, 20, 30)");
  });
});

describe("toRGBA", () => {
  it("includes alpha", () => {
    expect(toRGBA({ r: 10, g: 20, b: 30, a: 0.5 })).toBe(
      "rgba(10, 20, 30, 0.5)",
    );
  });
});

// ---------------------------------------------------------------------------
// rgbToHsl
// ---------------------------------------------------------------------------

describe("rgbToHsl", () => {
  it("converts red (255,0,0) → (0°, 100%, 50%)", () => {
    expect(rgbToHsl(255, 0, 0)).toEqual([0, 100, 50]);
  });

  it("converts green (0,255,0) → (120°, 100%, 50%)", () => {
    expect(rgbToHsl(0, 255, 0)).toEqual([120, 100, 50]);
  });

  it("converts blue (0,0,255) → (240°, 100%, 50%)", () => {
    expect(rgbToHsl(0, 0, 255)).toEqual([240, 100, 50]);
  });

  it("converts black → (0°, 0%, 0%)", () => {
    expect(rgbToHsl(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it("converts white → (0°, 0%, 100%)", () => {
    expect(rgbToHsl(255, 255, 255)).toEqual([0, 0, 100]);
  });

  it("converts achromatic gray → saturation 0", () => {
    const [, s] = rgbToHsl(128, 128, 128);
    expect(s).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// toHSL
// ---------------------------------------------------------------------------

describe("toHSL", () => {
  it("produces hsl() for fully opaque colors", () => {
    expect(toHSL({ r: 255, g: 0, b: 0, a: 1 })).toBe("hsl(0, 100%, 50%)");
  });

  it("produces hsla() when alpha < 1", () => {
    expect(toHSL({ r: 255, g: 0, b: 0, a: 0.5 })).toBe(
      "hsla(0, 100%, 50%, 0.5)",
    );
  });
});

// ---------------------------------------------------------------------------
// toOKLCH
// ---------------------------------------------------------------------------

describe("toOKLCH", () => {
  it("produces an oklch() string without alpha for opaque colors", () => {
    const result = toOKLCH({ r: 255, g: 0, b: 0, a: 1 });
    expect(result).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/);
  });

  it("includes / alpha for semi-transparent colors", () => {
    const result = toOKLCH({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(result).toContain("/ 0.5");
  });
});

// ---------------------------------------------------------------------------
// formatColor dispatcher
// ---------------------------------------------------------------------------

describe("formatColor", () => {
  const red = { r: 255, g: 0, b: 0, a: 1 };

  it("hex6", () => expect(formatColor(red, "hex6")).toBe("#ff0000"));
  it("hex8", () => expect(formatColor(red, "hex8")).toBe("#ff0000ff"));
  it("rgb", () => expect(formatColor(red, "rgb")).toBe("rgb(255, 0, 0)"));
  it("rgba", () => expect(formatColor(red, "rgba")).toBe("rgba(255, 0, 0, 1)"));
  it("hsl", () => expect(formatColor(red, "hsl")).toBe("hsl(0, 100%, 50%)"));
  it("oklch", () => expect(formatColor(red, "oklch")).toMatch(/^oklch\(/));
});

// ---------------------------------------------------------------------------
// Round-trip: parse → format → parse
// ---------------------------------------------------------------------------

describe("round-trips", () => {
  const testColors = [
    { r: 255, g: 0, b: 0, a: 1 },
    { r: 0, g: 128, b: 255, a: 1 },
    { r: 64, g: 64, b: 64, a: 1 },
    { r: 200, g: 150, b: 80, a: 1 },
  ];

  it("hex6 round-trip is lossless", () => {
    for (const c of testColors) {
      expect(parseColor(formatColor(c, "hex6"))).toEqual(c);
    }
  });

  it("rgb round-trip is lossless", () => {
    for (const c of testColors) {
      expect(parseColor(formatColor(c, "rgb"))).toEqual(c);
    }
  });

  it("hsl round-trip is within ±1 channel (rounding in HSL math)", () => {
    for (const c of testColors) {
      const result = parseColor(formatColor(c, "hsl"))!;
      expect(result.r).toBeCloseTo(c.r, -1);
      expect(result.g).toBeCloseTo(c.g, -1);
      expect(result.b).toBeCloseTo(c.b, -1);
    }
  });

  it("oklch round-trip is within ±1 channel (float pipeline)", () => {
    for (const c of testColors) {
      const result = parseColor(formatColor(c, "oklch"))!;
      expect(result.r).toBeCloseTo(c.r, -1);
      expect(result.g).toBeCloseTo(c.g, -1);
      expect(result.b).toBeCloseTo(c.b, -1);
    }
  });
});
