import { describe, expect, it } from "vitest";

import {
  buildTiles,
  GRID_COLS,
  GRID_ROWS,
  summarize,
  tileBox,
  tileDetail,
  tileRequest,
  tileSrc,
  type Tile,
} from "@/lib/photo-demo";
import {
  MAX_SIZE,
  MIN_SIZE,
  parsePhotoRequest,
  type ParsedPhotoRequest,
} from "@/lib/photo-url";

const TILES = buildTiles();

/**
 * Cell sizes spanning a 320px phone to a 3840px display, plus the pixel
 * ratios that go with them. The wide/2x corner is the one that pushes a tile
 * past the service's size ceiling.
 */
const CELLS = [13, 16, 27, 60, 63, 64, 80, 107, 160];
/**
 * Fractional ratios are the point of this list, not padding: Windows and
 * ChromeOS report 1.25 / 1.5 / 1.75 for their common scale settings, and an
 * integers-only sweep let a `Math.floor` here silently request 1x rasters.
 */
const RATIOS = [1, 1.25, 1.5, 1.75, 2, 3];

function eachMetric(run: (cell: number, ratio: number) => void): void {
  for (const cell of CELLS) {
    for (const ratio of RATIOS) {
      run(cell, ratio);
    }
  }
}

/**
 * Run a tile's URL through the real request parser the same way the API route
 * does: Next hands the route decoded path segments plus a parsed query.
 */
function parseSrc(src: string): ParsedPhotoRequest {
  const [path, search = ""] = src.split("?");
  const segments = path
    .replace(/^\/photo\//, "")
    .split("/")
    .map((segment) => decodeURIComponent(segment));
  const query: Record<string, string> = {};

  for (const [key, value] of new URLSearchParams(search)) {
    query[key] = value;
  }

  return parsePhotoRequest(segments, query);
}

describe("photo demo tiling", () => {
  it("covers every cell of the canvas exactly once", () => {
    const covered = new Map<string, number>();

    for (const tile of TILES) {
      for (let dx = 0; dx < tile.cols; dx++) {
        for (let dy = 0; dy < tile.rows; dy++) {
          const cell = `${tile.x + dx},${tile.y + dy}`;

          covered.set(cell, (covered.get(cell) ?? 0) + 1);
        }
      }
    }

    // No hole and no overlap: the page renders at gap 0 and relies on this.
    expect(covered.size).toBe(GRID_COLS * GRID_ROWS);
    expect([...covered.values()].filter((count) => count !== 1)).toEqual([]);
  });

  it("keeps every tile inside the canvas", () => {
    for (const tile of TILES) {
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.x + tile.cols).toBeLessThanOrEqual(GRID_COLS);
      expect(tile.y + tile.rows).toBeLessThanOrEqual(GRID_ROWS);
    }
  });

  it("gives every tile a distinct origin cell, which the page keys on", () => {
    const origins = new Set(TILES.map((tile) => `${tile.x}-${tile.y}`));

    expect(origins.size).toBe(TILES.length);
  });

  it("produces a busy wall of small tiles", () => {
    // The page promises "at least 50 images"; the canvas yields far more.
    expect(TILES.length).toBeGreaterThanOrEqual(50);

    const small = TILES.filter((tile) => tile.cols * tile.rows <= 6);

    expect(small.length / TILES.length).toBeGreaterThan(0.5);
  });

  it("is a pure function of position", () => {
    expect(buildTiles()).toEqual(TILES);
  });
});

describe("tileRequest", () => {
  it("asks for exactly the rendered box in vector mode", () => {
    eachMetric((cell, ratio) => {
      for (const tile of TILES.filter((entry) => entry.format === "svg")) {
        // An SVG is sharp at any ratio, and the `label` style prints its own
        // dimensions — so it must be asked for at its true size, never scaled.
        expect(tileRequest(tile, cell, ratio)).toEqual(tileBox(tile, cell));
      }
    });
  });

  it("asks rasters for device pixels, capped at 2x", () => {
    const tile = TILES.find((entry) => entry.format !== "svg");

    if (tile === undefined) throw new Error("expected a raster tile");

    const box = tileBox(tile, 16);

    const doubled = { w: box.w * 2, h: box.h * 2 };

    expect(tileRequest(tile, 16, 1)).toEqual(box);
    expect(tileRequest(tile, 16, 2)).toEqual(doubled);
    // A 3x display gets the same bytes as a 2x one: the sources are 512².
    expect(tileRequest(tile, 16, 3)).toEqual(doubled);
    // Fractional scaling rounds UP. Flooring these to 1x would hand the
    // browser a raster to upscale, which is the blur the multiplier prevents.
    expect(tileRequest(tile, 16, 1.25)).toEqual(doubled);
    expect(tileRequest(tile, 16, 1.5)).toEqual(doubled);
    expect(tileRequest(tile, 16, 1.75)).toEqual(doubled);
  });

  it("falls back to 1x rather than emitting a broken size", () => {
    const tile = TILES.find((entry) => entry.format !== "svg");

    if (tile === undefined) throw new Error("expected a raster tile");

    // Not reachable from a conforming `devicePixelRatio`, but this is an
    // exported helper and NaN would propagate into the URL as `/NaN/NaN.jpg`.
    for (const ratio of [Number.NaN, Number.POSITIVE_INFINITY, 0, -1]) {
      const { w, h } = tileRequest(tile, 16, ratio);

      expect(Number.isInteger(w)).toBe(true);
      expect(Number.isInteger(h)).toBe(true);
      expect(w).toBeGreaterThanOrEqual(MIN_SIZE);
      expect(h).toBeGreaterThanOrEqual(MIN_SIZE);
    }
  });

  it("stays inside the service's size bounds at every viewport", () => {
    eachMetric((cell, ratio) => {
      for (const tile of TILES) {
        const { w, h } = tileRequest(tile, cell, ratio);

        expect(w).toBeGreaterThanOrEqual(MIN_SIZE);
        expect(h).toBeGreaterThanOrEqual(MIN_SIZE);
        expect(w).toBeLessThanOrEqual(MAX_SIZE);
        expect(h).toBeLessThanOrEqual(MAX_SIZE);
      }
    });
  });

  it("keeps the requested ratio exactly equal to the slot's", () => {
    eachMetric((cell, ratio) => {
      for (const tile of TILES) {
        const { w, h } = tileRequest(tile, cell, ratio);

        // Integer maths throughout: the clamp scales the cell, never one axis.
        expect(w * tile.rows).toBe(h * tile.cols);
        expect(Number.isInteger(w)).toBe(true);
        expect(Number.isInteger(h)).toBe(true);
      }
    });
  });

  it("scales a whole tile down rather than exceeding the ceiling", () => {
    // A cell this large is past any real display, but the clamp still has to
    // hold: the widest tiles want more than MAX_SIZE even at 1:1.
    const CELL = 300;
    const capped = TILES.filter(
      (tile) => tileRequest(tile, CELL, 1).w < tileBox(tile, CELL).w,
    );

    expect(capped.length).toBeGreaterThan(0);

    for (const tile of capped) {
      const { w, h } = tileRequest(tile, CELL, 2);

      expect(Math.max(w, h)).toBeLessThanOrEqual(MAX_SIZE);
      // Scaled down as a whole, so the slot's ratio still holds exactly.
      expect(w * tile.rows).toBe(h * tile.cols);
      // And the chip says what was really asked for.
      expect(tileDetail(tile, CELL, 2)).toContain(`→ ${w}×${h}`);
    }
  });
});

describe("photo demo URLs", () => {
  it("parses as a renderable image, matching the tile", () => {
    eachMetric((cell, ratio) => {
      for (const tile of TILES) {
        const src = tileSrc(tile, cell, ratio);
        const parsed = parseSrc(src);

        if (parsed.kind !== "image") {
          throw new Error(
            `${src} did not parse as an image: ${
              parsed.kind === "error" ? parsed.message : parsed.kind
            }`,
          );
        }

        const { w, h } = tileRequest(tile, cell, ratio);

        expect(parsed.width).toBe(w);
        expect(parsed.height).toBe(h);
        expect(parsed.format).toBe(tile.format);
        expect(parsed.selector.type).toBe(tile.pin.by);
        expect(parsed.grayscale).toBe(tile.grayscale);
        // Blur was explicitly cut from the wall — it read as an artifact.
        expect(parsed.blur).toBeNull();
      }
    });
  });

  it("never pins by the random form", () => {
    for (const tile of TILES) {
      const src = tileSrc(tile, 64, 2);

      expect(src).toMatch(/^\/photo\/(seed|id|gen)\//);
      expect(parseSrc(src).kind).not.toBe("redirect-random");
    }
  });

  it("only asks for svg from procedural mode", () => {
    for (const tile of TILES) {
      if (tile.format === "svg") {
        expect(tile.pin.by).toBe("gen");
      }
    }
  });

  it("only puts style on procedural URLs", () => {
    for (const tile of TILES) {
      if (tile.pin.by !== "gen") {
        expect(tileSrc(tile, 64, 2)).not.toContain("style=");
      }
    }
  });

  it("carries no blur parameter", () => {
    for (const tile of TILES) {
      expect(tileSrc(tile, 64, 2)).not.toContain("blur");
      expect(tileDetail(tile, 64, 2)).not.toContain("blur");
    }
  });

  it("covers every source, style, and format the service serves", () => {
    const src = TILES.map((tile) => tileSrc(tile, 64, 2)).join("\n");

    for (const fragment of [
      "/photo/seed/",
      "/photo/id/",
      "/photo/gen/",
      ".jpg",
      ".webp",
      ".svg",
      "style=bauhaus",
      "style=noise",
      "style=label",
      "?grayscale",
    ]) {
      expect(src).toContain(fragment);
    }

    // gradient is the server's default, so it is spelled by its absence.
    expect(TILES.some((tile) => tileSrc(tile, 64, 2).endsWith(".svg"))).toBe(
      true,
    );
  });
});

describe("chip text", () => {
  const tile: Tile = {
    x: 0,
    y: 0,
    cols: 2,
    rows: 1,
    pin: { by: "id", id: 7 },
    format: "webp",
    grayscale: true,
  };

  it("describes the source, format, and filters", () => {
    expect(tileDetail(tile, 64, 1)).toBe("id 7 · webp · gray");
  });

  it("spells out a request that is not the tile's own size", () => {
    expect(tileDetail(tile, 64, 2)).toBe("id 7 · webp · → 256×128 · gray");
  });

  it("leaves a vector tile unqualified at any ratio", () => {
    const vector: Tile = { ...tile, format: "svg", grayscale: false };

    expect(tileDetail(vector, 64, 2)).toBe("id 7 · svg");
  });
});

describe("summarize", () => {
  it("splits the wall by source and counts distinct shapes", () => {
    const summary = summarize(TILES);

    expect(summary.total).toBe(TILES.length);
    expect(summary.photo + summary.gen).toBe(TILES.length);
    // A photo service's demo should read mostly as photographs.
    expect(summary.photo).toBeGreaterThan(summary.gen);
    expect(summary.shapes).toBeGreaterThan(10);
    expect(summary.shapes).toBeLessThanOrEqual(TILES.length);
  });
});
