import { describe, expect, it } from "vitest";
import {
  DEFAULT_PATTERN_STYLE,
  isPatternStyle,
  PATTERN_STYLES,
  READOUT_GLYPHS,
  renderPatternSvg,
  type PatternOptions,
  type PatternStyle,
} from "@/lib/photo-pattern";

function render(overrides: Partial<PatternOptions> = {}): string {
  return renderPatternSvg({
    seed: "hypothesis",
    width: 600,
    height: 400,
    style: "gradient",
    grayscale: false,
    blur: null,
    ...overrides,
  });
}

/** Every `url(#x)` reference in the document, in order. */
function references(svg: string): string[] {
  return [...svg.matchAll(/url\(#([^)]+)\)/g)].map((match) => match[1]);
}

function ids(svg: string): string[] {
  return [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
}

describe("PATTERN_STYLES", () => {
  it("lists the four styles in order", () => {
    expect(PATTERN_STYLES).toEqual(["gradient", "label", "bauhaus", "noise"]);
  });

  it("defaults to gradient", () => {
    expect(DEFAULT_PATTERN_STYLE).toBe("gradient");
    expect(PATTERN_STYLES).toContain(DEFAULT_PATTERN_STYLE);
  });
});

describe("isPatternStyle", () => {
  it("accepts every known style", () => {
    for (const style of PATTERN_STYLES) {
      expect(isPatternStyle(style)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isPatternStyle("")).toBe(false);
    expect(isPatternStyle("Gradient")).toBe(false);
    expect(isPatternStyle("mosaic")).toBe(false);
    expect(isPatternStyle("toString")).toBe(false);
  });
});

describe.each(PATTERN_STYLES)("renderPatternSvg (%s)", (style) => {
  it("is deterministic for identical options", () => {
    expect(render({ style })).toBe(render({ style }));
  });

  it("differs for a different seed", () => {
    expect(render({ style, seed: "alpha" })).not.toBe(
      render({ style, seed: "beta" }),
    );
  });

  it("differs for different geometry", () => {
    expect(render({ style, width: 300 })).not.toBe(render({ style }));
  });

  it("is a complete standalone SVG document", () => {
    const svg = render({ style, width: 600, height: 400 });

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="600"');
    expect(svg).toContain('height="400"');
    expect(svg).toContain('viewBox="0 0 600 400"');
  });

  it("paints an opaque ground covering the viewport", () => {
    const svg = render({ style });

    // First drawn element is always a full-bleed rect at the origin.
    expect(svg).toMatch(/<rect x="0" y="0" width="600" height="400"/);
  });

  it("emits no script, event handlers, or external references", () => {
    const svg = render({ style });

    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("foreignObject");
    expect(svg).not.toContain("<image");
    expect(svg).not.toContain("@import");
    expect(svg).not.toContain("http://www.w3.org/1999/xlink");
    expect(svg).not.toContain("href");
    expect(svg).not.toMatch(/\son[a-z]+\s*=/);
    // The only URLs are the xmlns and internal url(#id) fragments.
    expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', "")).not.toMatch(
      /https?:/,
    );
  });

  it("resolves every url(#id) reference inside the document", () => {
    const svg = render({ style, grayscale: true, blur: 4 });
    const declared = ids(svg);

    expect(references(svg).length).toBeGreaterThan(0);

    for (const reference of references(svg)) {
      expect(declared).toContain(reference);
    }
  });

  it("keeps every emitted number to at most two decimals", () => {
    const svg = render({ style, width: 733, height: 419 });
    // baseFrequency is the documented exception (4 decimals).
    const scrubbed = svg.replace(/baseFrequency="[^"]*"/g, "");

    expect(scrubbed).not.toMatch(/\d\.\d{3,}/);
    expect(scrubbed).not.toMatch(/\d[eE][+-]\d/);
    expect(svg).not.toContain("NaN");
    expect(svg).not.toContain("Infinity");
    expect(svg).not.toContain("undefined");
  });

  it("stays under ~3 KB at a typical 600x400", () => {
    expect(render({ style }).length).toBeLessThan(3072);
  });

  it("applies grayscale as an SVG filter primitive", () => {
    const svg = render({ style, grayscale: true });

    expect(svg).toContain('<feColorMatrix type="saturate" values="0"/>');
    expect(svg).toMatch(/<g filter="url\(#fx-[0-9a-f]+\)">/);
  });

  it("applies blur as an SVG filter primitive", () => {
    const svg = render({ style, blur: 6 });

    expect(svg).toContain('<feGaussianBlur stdDeviation="6"/>');
    expect(svg).toMatch(/<g filter="url\(#fx-[0-9a-f]+\)">/);
  });

  it("composes grayscale and blur into one filter", () => {
    const svg = render({ style, grayscale: true, blur: 3 });
    const filter = /<filter id="fx-[0-9a-f]+"[\s\S]*?<\/filter>/.exec(svg);

    expect(filter).not.toBeNull();
    expect(filter?.[0]).toContain('<feGaussianBlur stdDeviation="3"/>');
    expect(filter?.[0]).toContain(
      '<feColorMatrix type="saturate" values="0"/>',
    );
  });

  it("bleeds the ground past the viewport when blurred, so edges stay opaque", () => {
    const svg = render({ style, blur: 8 });
    const first =
      /<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/.exec(
        svg,
      );

    expect(first).not.toBeNull();
    expect(Number(first?.[1])).toBeLessThan(0);
    expect(Number(first?.[2])).toBeLessThan(0);
    expect(Number(first?.[3])).toBeGreaterThan(600);
    expect(Number(first?.[4])).toBeGreaterThan(400);
  });

  it.each([
    [1, 1],
    [1600, 1600],
    [1600, 1],
    [1, 1600],
  ])("stays well-formed at %ix%i", (width, height) => {
    const svg = render({ style, width, height, grayscale: true, blur: 5 });

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
    expect(svg).toContain(`width="${width}"`);
    expect(svg).toContain(`height="${height}"`);
    // No negative or zero-sized geometry, which is an error in SVG.
    expect(svg).not.toMatch(/\s(width|height|r|rx|ry)="-/);
    expect(svg).not.toContain("NaN");
    expect(svg.length).toBeLessThan(6144);
  });

  it("never interpolates the seed into the document", () => {
    const hostile = "</svg><script>alert(1)</script>";
    const svg = render({ style, seed: hostile });

    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("script");
    expect(svg).not.toContain("alert");
    expect(svg.startsWith("<svg")).toBe(true);
    // Exactly one closing tag: the seed did not open a document of its own.
    expect(svg.split("</svg>")).toHaveLength(2);
  });

  it("never leaks seed text of any shape", () => {
    const seed = "zzqx-marker-9f3";
    const svg = render({ style, seed });

    expect(svg).not.toContain("zzqx");
    expect(svg).not.toContain("marker");
    expect(svg).not.toContain(seed);
  });

  it("never lets a seed forge an attribute", () => {
    const svg = render({ style, seed: '" onload="alert(1)' });

    expect(svg).not.toContain("onload");
    expect(svg).not.toMatch(/\son[a-z]+\s*=/);
    expect(svg).not.toContain("alert");
  });

  it("derives element ids from the hash, not the raw seed", () => {
    const svg = render({ style, seed: "ident-check", grayscale: true });

    for (const id of ids(svg)) {
      expect(id).toMatch(/^[a-z]{1,2}-[0-9a-f]{6}$/);
    }
  });

  it("gives two differently-sized documents non-colliding ids", () => {
    const a = ids(render({ style, width: 600, height: 400, grayscale: true }));
    const b = ids(render({ style, width: 640, height: 400, grayscale: true }));

    expect(a.length).toBeGreaterThan(0);

    for (const id of a) {
      expect(b).not.toContain(id);
    }
  });
});

describe("renderPatternSvg (gradient)", () => {
  it("emits a multi-stop linear gradient", () => {
    const svg = render({ style: "gradient" });
    const stops = svg.match(/<stop /g) ?? [];

    expect(svg).toMatch(/<linearGradient id="g-[0-9a-f]+"/);
    expect(stops.length).toBeGreaterThanOrEqual(3);
  });

  it("varies its gradient direction by seed", () => {
    const angle = (seed: string): RegExpExecArray | null =>
      /<linearGradient[^>]*x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"/.exec(
        render({ style: "gradient", seed }),
      );

    const angles = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map((seed) =>
        JSON.stringify(angle(seed)?.slice(1)),
      ),
    );

    expect(angles.size).toBeGreaterThan(1);
  });
});

describe("renderPatternSvg (label)", () => {
  /**
   * The readout is the only path that rounds its ends, which makes
   * `stroke-linecap` a stable marker for it without inventing an attribute.
   */
  function readout(svg: string): string | undefined {
    return /<path d="([^"]+)"[^>]*stroke-linecap="round"/.exec(svg)?.[1];
  }

  /** Bounding box of a readout path's control points. */
  function bounds(d: string): { width: number; height: number } {
    const points = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(
      (match) => [Number(match[1]), Number(match[2])],
    );
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);

    return {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  it("draws the readout as stroked geometry, never as text", () => {
    const svg = render({ style: "label", width: 600, height: 400 });

    // librsvg in a serverless runtime has no fonts, so a <text> readout
    // rasterizes to tofu or to nothing at all.
    expect(svg).not.toContain("<text");
    expect(svg).not.toContain("font-");
    expect(svg).not.toContain("×");
    expect(readout(svg)).toBeDefined();
  });

  it("defines a line glyph for every character a readout can hold", () => {
    for (const char of "0123456789×") {
      const glyph = READOUT_GLYPHS[char];

      expect(glyph, char).toBeDefined();
      expect(glyph.length).toBeGreaterThan(0);

      for (const polyline of glyph) {
        // Flat [x0, y0, x1, y1, ...] pairs, at least one segment, all on the
        // unit cell.
        expect(polyline.length % 2).toBe(0);
        expect(polyline.length).toBeGreaterThanOrEqual(4);

        for (const coordinate of polyline) {
          expect(coordinate).toBeGreaterThanOrEqual(0);
          expect(coordinate).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("emits one subpath per glyph stroke, and none for the spaces", () => {
    const d =
      readout(render({ style: "label", width: 600, height: 400 })) ?? "";
    // "600 × 400": 6 + 0 + 0 + × (2) + 4 (2) + 0 + 0, spaces contribute none.
    const expected = ["6", "0", "0", "×", "4", "0", "0"].reduce(
      (total, char) => total + READOUT_GLYPHS[char].length,
      0,
    );

    expect((d.match(/M/g) ?? []).length).toBe(expected);
  });

  it("keeps the readout readable on a short banner and sane at 1600px", () => {
    const glyphHeight = (width: number, height: number): number =>
      bounds(readout(render({ style: "label", width, height })) ?? "").height;

    expect(glyphHeight(320, 32)).toBeGreaterThanOrEqual(9);
    expect(glyphHeight(1600, 1600)).toBeLessThanOrEqual(72);
    expect(glyphHeight(600, 400)).toBeGreaterThan(12);
  });

  it("keeps the readout inside the panel", () => {
    const svg = render({ style: "label", width: 600, height: 400 });
    const { width, height } = bounds(readout(svg) ?? "");

    // Panel is inset by 10% of the short side: 520 x 320.
    expect(width).toBeLessThan(520);
    expect(width).toBeGreaterThan(200);
    expect(height).toBeLessThan(320);
  });

  it("still reads as a placeholder with the readout stripped out", () => {
    const svg = render({ style: "label", width: 600, height: 400 });
    const withoutReadout = svg.replace(
      /<path[^>]*stroke-linecap="round"[^>]*\/>/,
      "",
    );

    expect(withoutReadout).not.toContain("stroke-linecap");
    expect(withoutReadout).toMatch(/<rect[^>]*stroke="#[0-9a-f]{6}"/);
    expect(
      (withoutReadout.match(/<rect /g) ?? []).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("omits the readout when the box is far too small for it", () => {
    const svg = render({ style: "label", width: 1, height: 1 });

    expect(svg).not.toContain("<text");
    expect(readout(svg)).toBeUndefined();
  });
});

describe("renderPatternSvg (bauhaus)", () => {
  it("draws a bounded number of geometric shapes", () => {
    const svg = render({ style: "bauhaus", width: 512, height: 512 });
    const shapes = svg.match(/<(circle|path|rect|ellipse) /g) ?? [];

    expect(shapes.length).toBeGreaterThan(1);
    expect(shapes.length).toBeLessThanOrEqual(20);
  });

  it("keeps the composition gridded at a wide aspect ratio", () => {
    const svg = render({ style: "bauhaus", width: 1200, height: 630 });
    const shapes = svg.match(/<(circle|path|rect) /g) ?? [];

    expect(shapes.length).toBeGreaterThan(1);
    expect(svg.length).toBeLessThan(3072);
  });
});

describe("renderPatternSvg (noise)", () => {
  it("emits a seeded fractal turbulence filter", () => {
    const svg = render({ style: "noise" });
    const turbulence = /<feTurbulence [^>]*\/>/.exec(svg)?.[0] ?? "";

    expect(turbulence).toContain('type="fractalNoise"');
    expect(turbulence).toMatch(/baseFrequency="0\.\d+"/);
    expect(turbulence).toMatch(/numOctaves="[2-4]"/);
    expect(turbulence).toMatch(/seed="\d+"/);
  });

  it("colorizes the noise with a color matrix that forces full alpha", () => {
    const values = /<feColorMatrix type="matrix" values="([^"]+)"/.exec(
      render({ style: "noise" }),
    )?.[1];

    expect(values).toBeDefined();
    expect(values?.split(" ")).toHaveLength(20);
    expect(values?.endsWith("0 0 0 0 1")).toBe(true);
  });

  it("varies its turbulence seed with the pattern seed", () => {
    const turbulenceSeed = (seed: string): string | undefined =>
      /<feTurbulence[^>]*seed="(\d+)"/.exec(
        render({ style: "noise", seed }),
      )?.[1];

    expect(turbulenceSeed("one")).not.toBe(turbulenceSeed("two"));
  });
});

describe("renderPatternSvg (input hardening)", () => {
  it("clamps out-of-range geometry", () => {
    const big = renderPatternSvg({
      seed: "x",
      width: 99999,
      height: 0,
      style: "gradient",
      grayscale: false,
      blur: null,
    });

    expect(big).toContain('width="1600"');
    expect(big).toContain('height="1"');
  });

  it("clamps an out-of-range blur", () => {
    const svg = render({ style: "gradient", blur: 99 });

    expect(svg).toContain('<feGaussianBlur stdDeviation="10"/>');
  });

  it("falls back to the default style for an unknown style", () => {
    const bogus = renderPatternSvg({
      seed: "x",
      width: 200,
      height: 200,
      style: "mosaic" as PatternStyle,
      grayscale: false,
      blur: null,
    });

    expect(bogus).toBe(
      render({
        style: DEFAULT_PATTERN_STYLE,
        seed: "x",
        width: 200,
        height: 200,
      }),
    );
  });

  it("handles an empty seed and a very long seed", () => {
    expect(render({ seed: "" }).startsWith("<svg")).toBe(true);
    expect(render({ seed: "x".repeat(100) }).startsWith("<svg")).toBe(true);
  });

  it("handles astral-plane and RTL seed characters", () => {
    const svg = render({ seed: "🙂🙃 مرحبا" });

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).not.toContain("🙂");
    expect(svg).not.toContain("مرحبا");
  });
});
