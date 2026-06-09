import { describe, expect, it } from "vitest";
import {
  gradientCoords, DIMS, DIM_KEYS, MAX_PREVIEW_H,
} from "@/lib/app-store-screenshot";

describe("DIMS", () => {
  it("has 8 dimensions", () => {
    expect(DIM_KEYS).toHaveLength(8);
  });

  it("includes iPhone and iPad sizes", () => {
    const groups = DIM_KEYS.map((d) => DIMS[d].group);

    expect(groups).toContain("iPhone");
    expect(groups).toContain("iPad");
  });

  it("has correct dimensions for 1242x2688", () => {
    const d = DIMS["1242x2688"];

    expect(d.w).toBe(1242);
    expect(d.h).toBe(2688);
    expect(d.group).toBe("iPhone");
  });
});

describe("MAX_PREVIEW_H", () => {
  it("is 480", () => {
    expect(MAX_PREVIEW_H).toBe(480);
  });
});

describe("gradientCoords", () => {
  it("returns 4 coordinates", () => {
    const result = gradientCoords(100, 200, 45);

    expect(result).toHaveLength(4);
  });

  it("produces valid numbers", () => {
    const result = gradientCoords(100, 200, 45);

    for (const v of result) {
      expect(typeof v).toBe("number");
      expect(isFinite(v)).toBe(true);
    }
  });

  it("handles 0 angle", () => {
    const [x0, y0, x1, y1] = gradientCoords(100, 100, 0);

    expect(x0).toBe(50);
    expect(y0).toBe(0);
    expect(x1).toBe(50);
    expect(y1).toBe(100);
  });

  it("handles 90 degree angle", () => {
    const [x0, y0, x1, y1] = gradientCoords(100, 100, 90);

    expect(x0).toBe(0);
    expect(y0).toBe(50);
    expect(x1).toBe(100);
    expect(y1).toBe(50);
  });

  it("handles 0 width", () => {
    const result = gradientCoords(0, 100, 45);

    for (const v of result) {
      expect(isFinite(v)).toBe(true);
    }
  });

  it("handles 0 height", () => {
    const result = gradientCoords(100, 0, 45);

    for (const v of result) {
      expect(isFinite(v)).toBe(true);
    }
  });
});
