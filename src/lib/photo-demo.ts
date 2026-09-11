/**
 * The tile wall behind /photo/demo: a gapless subdivision of a fixed cell
 * canvas, where every tile is a pinned photo-service URL.
 *
 * Two properties matter and both are covered by tests:
 *
 * - **The tiling is perfect.** Tiles are produced by recursive binary
 *   subdivision of the whole canvas, so they cover every cell exactly once
 *   with no holes and no overlaps. The page can therefore render them at
 *   `gap: 0` and get a seamless wall rather than a masonry layout with
 *   leftovers.
 * - **Every tile is a pure function of its position.** The only entropy is
 *   `hashSeed` over coordinates, so tile (x, y) is the same tile on every
 *   render, in every build, and in every browser. That is what makes the URLs
 *   cacheable: pinned `/photo/seed/…`, `/photo/id/…` and `/photo/gen/…` URLs
 *   are served immutable, while the random `/photo/{w}/{h}` form 302s per
 *   request under `no-cache` — a wall of those would miss the CDN every load.
 *
 * Sizes are not baked in here. A tile asks the service for exactly the box it
 * occupies — `span × cell`, where the cell is measured from the rendered grid
 * — so a `label` pattern prints its own true dimensions and nothing is
 * scaled to fit. See `tileRequest`.
 */

import { DEFAULT_PATTERN_STYLE, type PatternStyle } from "@/lib/photo-pattern";
import {
  buildGenPhotoPath,
  buildIdPhotoPath,
  buildSeededPhotoPath,
  extensionForFormat,
  hashSeed,
  MAX_SIZE,
  MIN_SIZE,
  type PhotoFormat,
  type PhotoQuery,
} from "@/lib/photo-url";

/** Which pinned URL form a tile uses. */
export type Pin =
  | { by: "seed"; seed: string }
  | { by: "id"; id: number }
  | { by: "gen"; seed: string; style: PatternStyle };

export interface Tile {
  /** Cell origin in the canvas, 0-based. */
  x: number;
  y: number;
  /** Span in cells. Also the aspect ratio of the requested image. */
  cols: number;
  rows: number;
  pin: Pin;
  format: PhotoFormat;
  grayscale: boolean;
}

/**
 * Canvas size in cells. The page sizes both track lists from one measured
 * cell in whole pixels, so cells are exactly square, tiles land on shared
 * track lines with no seams, and `span × cell` is a tile's true pixel box.
 */
export const GRID_COLS = 24;
export const GRID_ROWS = 16;

/** A rect this small usually stops subdividing — hence a wall of small tiles. */
const LEAF_AREA = 6;

/**
 * …and one this big occasionally does, which is the only thing putting a few
 * large tiles among the small ones. Raising either number thins the wall out.
 */
const BIG_LEAF_AREA = 20;

/**
 * Raster requests are multiplied by the display's pixel ratio so photos and
 * rasterized patterns are sharp rather than browser-upscaled. Capped at 2:
 * the photo library's sources are 512² and MAX_SIZE exists because there is
 * no more detail past it, so a 3x request would only cost bytes. Any ratio
 * above 1 therefore lands here — see `tileRequest` on why it rounds up.
 */
const MAX_PIXEL_RATIO = 2;

/**
 * Only the first 80 catalog ids are used. Slice ids are positional and the
 * library is only ever appended to, so an id in that range keeps pointing at
 * the same photo across every future deploy — which is the whole point of
 * `/photo/id/{n}`. Reading the manifest's real length would mean shipping the
 * manifest, generation prompts and all, to the browser.
 */
const CATALOG_IDS = 80;

const seed = (value: string): Pin => ({ by: "seed", seed: value });
const id = (value: number): Pin => ({ by: "id", id: value });

const gen = (value: string, style: PatternStyle): Pin => ({
  by: "gen",
  seed: value,
  style,
});

/**
 * Every pin form, pattern style, and format the service serves. Repeated
 * entries are the weighting: a uniform pick over this list is a biased pick
 * over the distinct recipes, and the bias is deliberate — this is a demo of a
 * *photo* service, so the wall should read as photographs with procedural
 * patterns cut into it, not the other way round.
 */
const RECIPES: readonly {
  pin: (key: string) => Pin;
  format: PhotoFormat;
}[] = [
  { pin: (key) => seed(`tile-${key}`), format: "jpeg" },
  { pin: (key) => seed(`tile-${key}`), format: "jpeg" },
  { pin: (key) => seed(`tile-${key}`), format: "jpeg" },
  { pin: (key) => seed(`tile-${key}`), format: "webp" },
  {
    pin: (key) => id(hashSeed(`catalog:${key}`) % CATALOG_IDS),
    format: "jpeg",
  },
  {
    pin: (key) => id(hashSeed(`catalog:${key}`) % CATALOG_IDS),
    format: "jpeg",
  },
  {
    pin: (key) => id(hashSeed(`catalog:${key}`) % CATALOG_IDS),
    format: "jpeg",
  },
  {
    pin: (key) => id(hashSeed(`catalog:${key}`) % CATALOG_IDS),
    format: "webp",
  },
  { pin: (key) => gen(`tile-${key}`, "gradient"), format: "svg" },
  { pin: (key) => gen(`tile-${key}`, "bauhaus"), format: "svg" },
  { pin: (key) => gen(`tile-${key}`, "noise"), format: "svg" },
  { pin: (key) => gen(`tile-${key}`, "label"), format: "svg" },
  { pin: (key) => gen(`tile-${key}`, "bauhaus"), format: "jpeg" },
  { pin: (key) => gen(`tile-${key}`, "noise"), format: "webp" },
];

/**
 * One deterministic draw. Each axis passes its own key prefix so the choices
 * a tile makes are independent of each other rather than correlated slices of
 * a single hash.
 */
function pick<T>(items: readonly T[], key: string): T {
  return items[hashSeed(key) % items.length];
}

interface Rect {
  x: number;
  y: number;
  cols: number;
  rows: number;
}

/**
 * Recursively split a rect until it is small enough to keep, collecting the
 * leaves. Every split is exact — the two halves partition the parent — so the
 * leaves partition the canvas.
 */
function subdivide(rect: Rect, out: Rect[]): void {
  const { x, y, cols, rows } = rect;
  const key = `${x}:${y}:${cols}:${rows}`;
  const area = cols * rows;
  const splittableX = cols > 1;
  const splittableY = rows > 1;
  const stopRoll = hashSeed(`stop:${key}`);

  if (
    (!splittableX && !splittableY) ||
    (area <= LEAF_AREA && stopRoll % 4 !== 0) ||
    (area <= BIG_LEAF_AREA && stopRoll % 11 === 0)
  ) {
    out.push(rect);

    return;
  }

  // Split the long axis of an elongated rect to stop it running away, and let
  // the hash choose on anything squarer — that free choice is what puts
  // slivers next to blocks instead of settling into rows.
  const splitY = !splittableX
    ? true
    : !splittableY
      ? false
      : rows > cols * 2
        ? true
        : cols > rows * 2
          ? false
          : hashSeed(`axis:${key}`) % 2 === 0;

  const extent = splitY ? rows : cols;
  const at = 1 + (hashSeed(`at:${key}`) % (extent - 1));

  if (splitY) {
    subdivide({ x, y, cols, rows: at }, out);
    subdivide({ x, y: y + at, cols, rows: rows - at }, out);
  } else {
    subdivide({ x, y, cols: at, rows }, out);
    subdivide({ x: x + at, y, cols: cols - at, rows }, out);
  }
}

export function buildTiles(): Tile[] {
  const leaves: Rect[] = [];

  subdivide({ x: 0, y: 0, cols: GRID_COLS, rows: GRID_ROWS }, leaves);

  return leaves.map(({ x, y, cols, rows }) => {
    const key = `${x}-${y}`;
    const recipe = pick(RECIPES, `source:${key}`);

    return {
      x,
      y,
      cols,
      rows,
      pin: recipe.pin(key),
      format: recipe.format,
      grayscale: hashSeed(`gray:${key}`) % 7 === 0,
    };
  });
}

/** A tile's true rendered box in CSS pixels, for a given measured cell. */
export function tileBox(tile: Tile, cell: number): { w: number; h: number } {
  return { w: tile.cols * cell, h: tile.rows * cell };
}

/**
 * The size actually asked of the service.
 *
 * SVG is requested at exactly the rendered box: it is vector, so it is sharp
 * at any ratio, and the `label` style draws its own dimensions — asking for
 * anything else would print a number that contradicts the tile. Raster
 * formats are requested at device pixels instead, since those genuinely are
 * resolution-bound.
 *
 * The multiplier is folded into an integer cell rather than applied to the
 * width and height separately, which keeps the requested aspect ratio exactly
 * equal to the slot's — no rounding drift — and lets the MAX_SIZE clamp stay
 * proportional on a viewport wide enough to need it.
 */
export function tileRequest(
  tile: Tile,
  cell: number,
  pixelRatio: number,
): { w: number; h: number } {
  // Round UP, never down. Windows and ChromeOS report 1.25 / 1.5 / 1.75 for
  // their 125% / 150% / 175% scale settings, and flooring those to 1 would
  // hand the browser a 1x raster to upscale — the exact blur this multiplier
  // exists to prevent. Rounding up lands on the already-budgeted 2x ceiling
  // instead, and downscaling always beats upscaling.
  const safeRatio = Number.isFinite(pixelRatio) ? pixelRatio : 1;
  const ratio =
    tile.format === "svg"
      ? 1
      : Math.min(Math.max(Math.ceil(safeRatio), 1), MAX_PIXEL_RATIO);
  const longest = Math.max(tile.cols, tile.rows);
  const effective = Math.max(
    MIN_SIZE,
    Math.min(Math.round(cell) * ratio, Math.floor(MAX_SIZE / longest)),
  );

  return { w: tile.cols * effective, h: tile.rows * effective };
}

/**
 * Build the tile's URL with the same helpers the service and the explorer
 * use, so what the wall hotlinks is the canonical URL form.
 */
export function tileSrc(tile: Tile, cell: number, pixelRatio: number): string {
  const { w, h } = tileRequest(tile, cell, pixelRatio);
  const target = { width: w, height: h, format: tile.format };
  const query: PhotoQuery = {};

  // `style` only means anything in procedural mode, and gradient is the
  // server's default — omitting it keeps the URL canonical.
  if (tile.pin.by === "gen" && tile.pin.style !== DEFAULT_PATTERN_STYLE) {
    query.style = tile.pin.style;
  }

  // A valueless entry is emitted as a bare `?grayscale` flag.
  if (tile.grayscale) query.grayscale = "";

  if (tile.pin.by === "id") {
    return buildIdPhotoPath(tile.pin.id, target, query);
  }

  return tile.pin.by === "gen"
    ? buildGenPhotoPath(tile.pin.seed, target, query)
    : buildSeededPhotoPath(tile.pin.seed, target, query);
}

/**
 * The chip's detail half: source, format, and the two things a reader cannot
 * infer from the picture.
 *
 * When the requested size is not the tile's own size it is spelled out rather
 * than described. Saying "@2x" would be a lie whenever the MAX_SIZE clamp
 * lands the request between 1x and 2x, and this page's whole claim is that
 * you can see what it asked for.
 */
export function tileDetail(
  tile: Tile,
  cell: number,
  pixelRatio: number,
): string {
  const source =
    tile.pin.by === "gen"
      ? tile.pin.style
      : tile.pin.by === "id"
        ? `id ${tile.pin.id}`
        : "seed";
  const parts = [source, extensionForFormat(tile.format)];
  const box = tileBox(tile, cell);
  const request = tileRequest(tile, cell, pixelRatio);

  if (request.w !== box.w || request.h !== box.h) {
    parts.push(`→ ${request.w}×${request.h}`);
  }

  if (tile.grayscale) parts.push("gray");

  return parts.join(" · ");
}

export interface TileSummary {
  total: number;
  photo: number;
  gen: number;
  /** Distinct slot shapes. Cell-independent, so it holds at any viewport. */
  shapes: number;
}

export function summarize(tiles: readonly Tile[]): TileSummary {
  return {
    total: tiles.length,
    photo: tiles.filter((tile) => tile.pin.by !== "gen").length,
    gen: tiles.filter((tile) => tile.pin.by === "gen").length,
    shapes: new Set(tiles.map((tile) => `${tile.cols}x${tile.rows}`)).size,
  };
}
