/**
 * Procedural placeholder artwork, emitted as a self-contained SVG string.
 *
 * This is the render half of `/photo/gen/{seed}/{w}/{h}`. The whole point is
 * that a request costs a few string concatenations: no rasterizing, no
 * per-pixel work in JS. Blur, grayscale and the noise field are all expressed
 * as SVG filter primitives so the client (or librsvg, on the `.jpg` / `.webp`
 * path) does the actual pixel pushing.
 *
 * Two invariants hold everywhere in this file:
 *
 * 1. It imports nothing. `photo-url.ts` imports *from* here, so this stays a
 *    dependency-free leaf and there is no cycle.
 * 2. The caller's `seed` never reaches the output. Only numbers derived from
 *    its hash do. The result is served as `image/svg+xml` from our own origin,
 *    where script inside an SVG document executes if a user navigates straight
 *    to the URL — so a seed must never be able to close a tag.
 */

export type PatternStyle = "gradient" | "label" | "bauhaus" | "noise";

export const PATTERN_STYLES: readonly PatternStyle[] = [
  "gradient",
  "label",
  "bauhaus",
  "noise",
];

export const DEFAULT_PATTERN_STYLE: PatternStyle = "gradient";

/**
 * Per-style ceiling on the resolution a RASTER (`.jpg`/`.webp`) is rendered at
 * before being scaled up to the requested size. `null` means "render at full
 * size" — the normal path.
 *
 * SVG is never affected: emitting it is string building, and it scales in the
 * client for free. Rasterizing is what costs, and it does not cost uniformly.
 * Measured locally, SVG -> JPEG through sharp/librsvg:
 *
 *   size    noise    gradient
 *   256     5.3ms    -
 *   512    20.0ms    -
 *   800    47.4ms    3.2ms
 *   1600  191.5ms   10.0ms
 *
 * feTurbulence is evaluated per output pixel and scales superlinearly, while
 * every other style stays at or under the photo pipeline's own cost (~10ms at
 * 1600). Rendering noise at 512 and scaling the bitmap up costs ~48ms at
 * 1600x1600 instead of ~211ms, and on a noise field the two are visually
 * indistinguishable — verified by comparing renders, not assumed.
 *
 * The scale-up MUST be a second sharp pass over the rendered bitmap. Two
 * things that look like they would work and do not: a `scale()` transform in
 * the SVG (librsvg computes filters in device space, so cost is unchanged),
 * and `sharp(svg).resize(w, h)` (sharp re-renders vector input at the target
 * size, measuring identically to full-res).
 */
export const RASTER_RENDER_CAP: Record<PatternStyle, number | null> = {
  gradient: null,
  label: null,
  bauhaus: null,
  noise: 512,
};

export function isPatternStyle(value: string): value is PatternStyle {
  return (PATTERN_STYLES as readonly string[]).includes(value);
}

export interface PatternOptions {
  seed: string;
  /** 1..1600 */
  width: number;
  /** 1..1600 */
  height: number;
  style: PatternStyle;
  grayscale: boolean;
  /** 1..10 when present. */
  blur: number | null;
}

/**
 * Deliberately duplicated from `photo-url.ts` rather than imported, for the
 * same reason as `hashString`: this module is a dependency-free leaf and
 * `photo-url.ts` imports *from* it, so importing back would be a cycle.
 *
 * These are not the validation bounds — the parser rejects out-of-range
 * requests long before this module runs. They exist only so `renderPatternSvg`
 * can never emit a malformed document when called directly (tests, future
 * callers). If the parser's bounds widen, widening these is optional; they must
 * never be NARROWER, or the parser would accept a size this silently reclamps.
 */
const MIN_SIZE = 1;
const MAX_SIZE = 1600;
const MIN_BLUR = 1;
const MAX_BLUR = 10;

/** Hard ceiling on drawn shapes, so output size stays bounded. */
const MAX_SHAPES = 16;

/* -------------------------------------------------------------------------
 * Determinism primitives
 * ---------------------------------------------------------------------- */

/**
 * FNV-1a over UTF-16 code units.
 *
 * Deliberately duplicated from `photo-url.ts`'s `hashSeed` rather than
 * imported: `photo-url.ts` imports this module, so importing back would be a
 * cycle. Keep the two implementations byte-compatible if either changes.
 */
function hashString(value: string): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

/** Fold extra integers into a hash, so ids differ per geometry and style. */
function mixHash(hash: number, ...parts: number[]): number {
  let mixed = hash >>> 0;

  for (const part of parts) {
    mixed = Math.imul(mixed ^ (part >>> 0), 0x01000193) >>> 0;
  }

  return mixed >>> 0;
}

/**
 * mulberry32. Every random value in a document comes from here, seeded by the
 * hash — never `Math.random`, never anything ambient.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------
 * Number and color formatting
 * ---------------------------------------------------------------------- */

/** Emit at most 2 decimals, so no `0.30000000000000004` reaches the document. */
function num(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const rounded = Math.round(value * 100) / 100;

  return String(rounded === 0 ? 0 : rounded);
}

/**
 * `baseFrequency` is the one attribute where 2 decimals is too coarse — the
 * useful range is roughly 0.004 to 0.03. 4 decimals, still exactly rounded.
 */
function freq(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;

  // Same -0 guard as num(). Unreachable while the only caller passes a
  // positive frequency, but a stray "-0" in an attribute would break the
  // byte-identical-output guarantee the moment this is reused for a signed
  // value.
  return String(rounded === 0 ? 0 : rounded);
}

function channelHex(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.round(value * 255)));

  return byte.toString(16).padStart(2, "0");
}

/**
 * HSL to `#rrggbb`. Converting here rather than emitting `hsl(...)` keeps the
 * output independent of any CSS color parser (librsvg included) and shorter.
 */
function hsl(hue: number, saturation: number, lightness: number): string {
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const l = Math.max(0, Math.min(100, lightness)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const h = (((hue % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 1) {
    [r, g, b] = [c, x, 0];
  } else if (h < 2) {
    [r, g, b] = [x, c, 0];
  } else if (h < 3) {
    [r, g, b] = [0, c, x];
  } else if (h < 4) {
    [r, g, b] = [0, x, c];
  } else if (h < 5) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  return `#${channelHex(r + m)}${channelHex(g + m)}${channelHex(b + m)}`;
}

/** `#rrggbb` back to 0..1 components, for feColorMatrix coefficients. */
function unitRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

/* -------------------------------------------------------------------------
 * Palette
 * ---------------------------------------------------------------------- */

interface Palette {
  /** Dark ground vs. light ground; both are seeded and both stay muted. */
  dark: boolean;
  bg: string;
  surface: string;
  line: string;
  ink: string;
  tints: [string, string, string];
  accent: string;
}

/**
 * One harmonized family per seed: a base hue, two analogous neighbours, and a
 * near-complementary accent. Saturation and lightness sit in deliberately
 * narrow bands so all four styles read as the same design system.
 */
function buildPalette(rand: () => number): Palette {
  const hue = Math.floor(rand() * 360);
  const dark = rand() < 0.5;
  const spread = 16 + Math.floor(rand() * 26);
  const sat = 38 + Math.floor(rand() * 26);
  const accentHue = (hue + 140 + Math.floor(rand() * 80)) % 360;
  const near = (hue + spread) % 360;
  const far = (hue - spread + 360) % 360;

  if (dark) {
    return {
      dark,
      bg: hsl(hue, sat * 0.5, 13),
      surface: hsl(hue, sat * 0.45, 19),
      line: hsl(hue, sat * 0.4, 33),
      ink: hsl(hue, 18, 88),
      tints: [
        hsl(hue, sat, 34),
        hsl(near, sat, 45),
        hsl(far, Math.max(24, sat - 8), 26),
      ],
      accent: hsl(accentHue, Math.min(78, sat + 16), 58),
    };
  }

  return {
    dark,
    bg: hsl(hue, sat * 0.35, 93),
    surface: hsl(hue, sat * 0.3, 87),
    line: hsl(hue, sat * 0.3, 71),
    ink: hsl(hue, 24, 24),
    tints: [
      hsl(hue, sat, 62),
      hsl(near, Math.max(24, sat - 6), 73),
      hsl(far, sat, 52),
    ],
    accent: hsl(accentHue, Math.min(70, sat + 10), 48),
  };
}

/* -------------------------------------------------------------------------
 * Shared drawing helpers
 * ---------------------------------------------------------------------- */

interface PatternContext {
  width: number;
  height: number;
  /**
   * How far the artwork bleeds past the viewport. Blur samples outside the
   * shapes it is applied to, so with a blur the ground is painted oversized:
   * otherwise the edges fade to transparent and a blurred placeholder gets
   * pale translucent borders (and JPEG, which has no alpha, renders those as
   * grey mush).
   */
  bleed: number;
  rand: () => number;
  palette: Palette;
  uid: string;
  hash: number;
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  attrs: string,
): string {
  if (width <= 0 || height <= 0) {
    return "";
  }

  return `<rect x="${num(x)}" y="${num(y)}" width="${num(width)}" height="${num(height)}" ${attrs}/>`;
}

/** Opaque edge-to-edge ground, oversized by the blur bleed. */
function ground(ctx: PatternContext, attrs: string): string {
  const b = ctx.bleed;

  return rect(-b, -b, ctx.width + b * 2, ctx.height + b * 2, attrs);
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function between(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/* -------------------------------------------------------------------------
 * Styles
 * ---------------------------------------------------------------------- */

/**
 * Multi-stop linear gradient at a seeded angle, with a few large soft blobs
 * floating over it. Direction comes from small integer components normalized
 * with `Math.sqrt` (which IEEE-754 requires to be exactly rounded) rather than
 * `Math.cos`/`Math.sin`, whose precision is implementation-defined — that
 * keeps the output bit-identical across engines and platforms.
 */
function renderGradient(ctx: PatternContext, defs: string[]): string {
  const { width, height, rand, palette, uid } = ctx;

  let dx = 0;
  let dy = 0;

  while (dx === 0 && dy === 0) {
    dx = Math.floor(rand() * 9) - 4;
    dy = Math.floor(rand() * 9) - 4;
  }

  const length = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / length / 2;
  const uy = dy / length / 2;

  // Stops stay analogous — dropping the near-complementary accent in here is
  // what keeps a seeded gradient from banding into a rainbow. The accent gets
  // its pop from a single blob instead.
  const ramp = [palette.tints[2], palette.tints[0], palette.tints[1]];
  const colors = rand() < 0.5 ? ramp : [...ramp].reverse();

  const stops = colors
    .map((color, index) => {
      const even = index / (colors.length - 1);
      const offset =
        index === 0 || index === colors.length - 1
          ? even
          : Math.max(0.08, Math.min(0.92, even + (rand() - 0.5) * 0.18));

      return `<stop offset="${num(offset)}" stop-color="${color}"/>`;
    })
    .join("");

  defs.push(
    `<linearGradient id="g-${uid}" x1="${num(0.5 - ux)}" y1="${num(0.5 - uy)}" x2="${num(0.5 + ux)}" y2="${num(0.5 + uy)}">${stops}</linearGradient>`,
  );

  const softness = Math.max(0.6, Math.min(width, height) / 6);

  defs.push(
    `<filter id="s-${uid}" x="-45%" y="-45%" width="190%" height="190%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${num(softness)}"/></filter>`,
  );

  const blobColors = [
    palette.accent,
    palette.tints[1],
    palette.ink,
    palette.tints[2],
  ];
  const blobCount = 2 + Math.floor(rand() * 2);
  const blobs: string[] = [];

  // The first blob always carries the accent, so every gradient gets one focal
  // point instead of relying on a lucky draw.
  for (let i = 0; i < blobCount; i++) {
    const cx = width * between(rand, 0.05, 0.95);
    const cy = height * between(rand, 0.05, 0.95);
    const rx = width * between(rand, 0.18, 0.42);
    const ry = height * between(rand, 0.18, 0.42);

    blobs.push(
      `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(ry)}" fill="${i === 0 ? palette.accent : pick(rand, blobColors)}"/>`,
    );
  }

  return [
    ground(ctx, `fill="url(#g-${uid})"`),
    `<g filter="url(#s-${uid})" opacity="0.5">${blobs.join("")}</g>`,
  ].join("");
}

/**
 * A drafting-style dimension card: sharp inset panel, corner registration
 * marks, dimension lines with end ticks in the margins, a ruler scale stepped
 * along two edges, and the pixel size called out on a plate in the middle.
 *
 * IMPORTANT: on the raster path librsvg may be running in a serverless image
 * with no fonts installed, in which case the `<text>` silently disappears.
 * Everything except the readout is geometry for exactly that reason — a
 * text-less render still reads as a deliberate technical placeholder rather
 * than a broken one. Do not move any load-bearing detail into the text.
 *
 * The width and height numbers are the only user-influenced values that appear
 * as text, and they are clamped integers, so there is nothing to escape.
 */
function renderLabel(ctx: PatternContext): string {
  const { width, height, palette } = ctx;
  const min = Math.min(width, height);
  const parts = [ground(ctx, `fill="${palette.bg}"`)];

  const pad = Math.max(2, Math.min(56, Math.round(min * 0.1)));
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const right = pad + innerWidth;
  const bottom = pad + innerHeight;
  const stroke = Math.max(0.5, Math.min(2, min / 500));
  const hair = Math.max(0.35, stroke * 0.7);
  // Below this the drafting furniture turns to mush, so only the panel and the
  // readout survive.
  const detailed = innerWidth > 48 && innerHeight > 48;

  if (innerWidth > 2 && innerHeight > 2) {
    parts.push(
      rect(
        pad,
        pad,
        innerWidth,
        innerHeight,
        `fill="${palette.surface}" stroke="${palette.ink}" stroke-opacity="0.35" stroke-width="${num(stroke)}"`,
      ),
    );
  }

  if (detailed) {
    // Construction diagonals: the "nothing here yet" cross, kept faint so the
    // readout stays dominant.
    parts.push(
      `<path d="M${num(pad)} ${num(pad)}L${num(right)} ${num(bottom)}M${num(right)} ${num(pad)}L${num(pad)} ${num(bottom)}" fill="none" stroke="${palette.ink}" stroke-width="${num(hair)}" opacity="0.16"/>`,
    );

    // Ruler scale stepped along the inside of the top and left edges. Every
    // fifth division gets a long tick, the way a real scale is graduated.
    const tick = Math.max(2, Math.min(12, min * 0.028));
    const columns = Math.max(4, Math.min(20, Math.round(innerWidth / 56)));
    const rows = Math.max(4, Math.min(20, Math.round(innerHeight / 56)));
    let scale = "";

    for (let i = 1; i < columns; i++) {
      const x = pad + (innerWidth / columns) * i;

      scale += `M${num(x)} ${num(pad)}V${num(pad + (i % 5 === 0 ? tick * 1.9 : tick))}`;
    }

    for (let i = 1; i < rows; i++) {
      const y = pad + (innerHeight / rows) * i;

      scale += `M${num(pad)} ${num(y)}H${num(pad + (i % 5 === 0 ? tick * 1.9 : tick))}`;
    }

    parts.push(
      `<path d="${scale}" fill="none" stroke="${palette.ink}" stroke-width="${num(hair)}" opacity="0.5"/>`,
    );

    // Corner registration marks, in the accent so the seeded colour reads.
    const mark = Math.max(4, Math.min(26, min * 0.06));

    parts.push(
      `<path d="M${num(pad)} ${num(pad + mark)}V${num(pad)}H${num(pad + mark)}M${num(right - mark)} ${num(pad)}H${num(right)}V${num(pad + mark)}M${num(right)} ${num(bottom - mark)}V${num(bottom)}H${num(right - mark)}M${num(pad + mark)} ${num(bottom)}H${num(pad)}V${num(bottom - mark)}" fill="none" stroke="${palette.accent}" stroke-width="${num(stroke * 1.8)}"/>`,
    );

    // Dimension lines with end ticks, in the margin outside the panel — the
    // detail that makes it read as a measured drawing rather than a frame.
    if (pad >= 9) {
      const end = Math.min(pad * 0.3, 7);
      const midX = pad / 2;
      const midY = pad / 2;

      parts.push(
        `<path d="M${num(pad)} ${num(midY)}H${num(right)}M${num(pad)} ${num(midY - end)}V${num(midY + end)}M${num(right)} ${num(midY - end)}V${num(midY + end)}M${num(midX)} ${num(pad)}V${num(bottom)}M${num(midX - end)} ${num(pad)}H${num(midX + end)}M${num(midX - end)} ${num(bottom)}H${num(midX + end)}" fill="none" stroke="${palette.accent}" stroke-width="${num(hair * 1.6)}"/>`,
      );
    }
  }

  const label = `${width} × ${height}`;
  // Monospace advance is ~0.62em, so this is the widest the string can be.
  const fitted = Math.min(
    height * 0.15,
    (width * 0.58) / (0.62 * label.length),
  );
  const fontSize = Math.max(9, Math.min(64, fitted));
  const textWidth = fontSize * 0.62 * label.length;
  const textHeight = fontSize * 1.6;

  if (
    innerWidth > textWidth &&
    innerHeight > textHeight &&
    innerWidth > 2 &&
    innerHeight > 2
  ) {
    // A plate behind the readout so it stays legible where the diagonals cross.
    if (detailed) {
      const plateWidth = textWidth + fontSize * 1.1;
      const plateHeight = textHeight;

      parts.push(
        rect(
          width / 2 - plateWidth / 2,
          height / 2 - plateHeight / 2,
          plateWidth,
          plateHeight,
          `fill="${palette.surface}" stroke="${palette.ink}" stroke-opacity="0.28" stroke-width="${num(hair)}"`,
        ),
      );
    }

    parts.push(
      `<text x="${num(width / 2)}" y="${num(height / 2)}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${num(fontSize)}" fill="${palette.ink}" text-anchor="middle" dominant-baseline="central" letter-spacing="${num(fontSize * 0.06)}">${label}</text>`,
    );
  }

  return parts.join("");
}

/**
 * Circles, half-circles, quarter arcs and bars snapped to a seeded coarse
 * grid. The row count is derived from the aspect ratio so cells stay roughly
 * square — that is what keeps it composed at 1200x630 and not just at 1:1.
 */
function renderBauhaus(ctx: PatternContext): string {
  const { width, height, rand, palette } = ctx;
  const parts = [
    ground(ctx, `fill="${palette.dark ? palette.bg : palette.surface}"`),
  ];

  // One extra column on large canvases, so a 1200x630 hero is not four huge
  // shapes. Rows follow the aspect ratio, which keeps cells roughly square.
  const cols =
    3 + Math.floor(rand() * 3) + (Math.max(width, height) >= 900 ? 1 : 0);
  const rows = Math.max(1, Math.min(6, Math.round((cols * height) / width)));
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const colors = [
    palette.tints[0],
    palette.tints[1],
    palette.tints[2],
    palette.accent,
    palette.ink,
  ];
  // Rotating the palette by a coprime stride instead of drawing each fill
  // independently: random picks clump onto two colors on a sparse grid.
  const colorStart = Math.floor(rand() * colors.length);
  const colorStride = 1 + Math.floor(rand() * (colors.length - 1));
  // Thin the fill rate rather than truncating at the cap, so a big grid stays
  // evenly populated instead of going bare below the row where the cap hits.
  const density = Math.min(0.68, MAX_SHAPES / (cols * rows));

  let drawn = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Every branch consumes the same draws, so the grid stays stable.
      const roll = rand();
      // Weighted, not uniform: quarter arcs are the thinnest mark, so too many
      // of them leave the composition looking sparse rather than composed.
      const shape = rand();
      const kind = shape < 0.36 ? 0 : shape < 0.62 ? 1 : shape < 0.76 ? 2 : 3;
      const scale = between(rand, 0.72, 1);
      const turn = Math.floor(rand() * 4) * 90;

      if (roll > density || drawn >= MAX_SHAPES) {
        continue;
      }

      const fill = colors[(colorStart + drawn * colorStride) % colors.length];

      const cx = (col + 0.5) * cellWidth;
      const cy = (row + 0.5) * cellHeight;
      const r = (Math.min(cellWidth, cellHeight) / 2) * scale;

      if (r <= 0.02) {
        continue;
      }

      const rotate =
        turn === 0 ? "" : ` transform="rotate(${turn} ${num(cx)} ${num(cy)})"`;

      if (kind === 0) {
        parts.push(
          `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${fill}"/>`,
        );
      } else if (kind === 1) {
        parts.push(
          `<path d="M${num(cx - r)} ${num(cy)}A${num(r)} ${num(r)} 0 0 1 ${num(cx + r)} ${num(cy)}Z" fill="${fill}"${rotate}/>`,
        );
      } else if (kind === 2) {
        parts.push(
          `<path d="M${num(cx - r)} ${num(cy)}A${num(r)} ${num(r)} 0 0 1 ${num(cx)} ${num(cy - r)}" fill="none" stroke="${fill}" stroke-width="${num(Math.max(0.5, r * 0.38))}"${rotate}/>`,
        );
      } else {
        const barWidth = cellWidth * 0.72 * scale;
        const barHeight = cellHeight * 0.24 * scale;

        parts.push(
          rect(
            cx - barWidth / 2,
            cy - barHeight / 2,
            barWidth,
            barHeight,
            `fill="${fill}"${rotate}`,
          ),
        );
      }

      drawn++;
    }
  }

  return parts.join("");
}

/**
 * A fractal noise field colorized into the palette. This is where SVG really
 * pays: the client renders the turbulence, the server emits ~300 bytes of
 * filter. Verified that librsvg 2.61.2 renders `feTurbulence`, so the raster
 * path works too.
 */
function renderNoise(ctx: PatternContext, defs: string[]): string {
  const { width, height, rand, palette, uid, hash } = ctx;

  // Ends of the ramp are picked for a real lightness gap in both palettes —
  // pairing two neighbouring tints washes out to flat grey.
  const [lowHex, highHex] = palette.dark
    ? [palette.bg, rand() < 0.5 ? palette.tints[1] : palette.tints[0]]
    : [rand() < 0.5 ? palette.tints[0] : palette.tints[2], palette.bg];
  const low = unitRgb(lowHex);
  const high = unitRgb(highHex);
  // R_out = low + (high - low) * noise.r, driven off one channel so the field
  // is a smooth two-tone ramp instead of RGB confetti. Alpha is forced to 1.
  const matrix = [0, 1, 2]
    .map((channel) => {
      const gain = num(high[channel] - low[channel]);

      return `${gain} 0 0 0 ${num(low[channel])}`;
    })
    .join(" ");

  const baseFrequency = between(rand, 0.004, 0.026);
  const octaves = 2 + Math.floor(rand() * 3);

  defs.push(
    `<filter id="n-${uid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
      `<feTurbulence type="fractalNoise" baseFrequency="${freq(baseFrequency)}" numOctaves="${octaves}" seed="${hash % 65536}"/>` +
      `<feColorMatrix type="matrix" values="${matrix} 0 0 0 0 1"/>` +
      `</filter>`,
  );

  defs.push(
    `<radialGradient id="v-${uid}" cx="0.5" cy="0.5" r="0.72">` +
      `<stop offset="0.5" stop-color="${palette.bg}" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="${palette.bg}" stop-opacity="0.7"/>` +
      `</radialGradient>`,
  );

  return [
    ground(ctx, `fill="${palette.bg}"`),
    ground(ctx, `filter="url(#n-${uid})" fill="${palette.bg}"`),
    rect(0, 0, width, height, `fill="url(#v-${uid})"`),
  ].join("");
}

/* -------------------------------------------------------------------------
 * Entry point
 * ---------------------------------------------------------------------- */

function clampSize(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_SIZE;
  }

  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(value)));
}

function clampBlur(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(MIN_BLUR, Math.min(MAX_BLUR, Math.round(value)));
}

/**
 * Render one placeholder. Identical options always produce a byte-identical
 * string; nothing here reads the clock, the environment or `Math.random`.
 */
export function renderPatternSvg(options: PatternOptions): string {
  const width = clampSize(options.width);
  const height = clampSize(options.height);
  const style = isPatternStyle(options.style)
    ? options.style
    : DEFAULT_PATTERN_STYLE;
  const blur = clampBlur(options.blur);
  const grayscale = options.grayscale;

  const hash = hashString(options.seed);
  const rand = mulberry32(hash);
  const palette = buildPalette(rand);
  // Ids are suffixed from the numeric hash — never the raw seed — mixed with
  // geometry and effects so two of these can be inlined in one HTML page
  // without colliding.
  const uid = mixHash(
    hash,
    width,
    height,
    PATTERN_STYLES.indexOf(style),
    grayscale ? 1 : 0,
    blur ?? 0,
  )
    .toString(16)
    .padStart(8, "0")
    .slice(-6);

  const ctx: PatternContext = {
    width,
    height,
    bleed: blur ? Math.ceil(blur * 3) : 0,
    rand,
    palette,
    uid,
    hash,
  };

  const defs: string[] = [];
  let body: string;

  if (style === "label") {
    body = renderLabel(ctx);
  } else if (style === "bauhaus") {
    body = renderBauhaus(ctx);
  } else if (style === "noise") {
    body = renderNoise(ctx, defs);
  } else {
    body = renderGradient(ctx, defs);
  }

  const effects: string[] = [];

  if (blur !== null) {
    effects.push(`<feGaussianBlur stdDeviation="${num(blur)}"/>`);
  }

  if (grayscale) {
    effects.push(`<feColorMatrix type="saturate" values="0"/>`);
  }

  if (effects.length > 0) {
    defs.push(
      `<filter id="fx-${uid}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">${effects.join("")}</filter>`,
    );
    body = `<g filter="url(#fx-${uid})">${body}</g>`;
  }

  const definitions = defs.length > 0 ? `<defs>${defs.join("")}</defs>` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    definitions +
    body +
    `</svg>`
  );
}
