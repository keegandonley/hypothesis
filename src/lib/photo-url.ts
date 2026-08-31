/**
 * Pure request parsing for the placeholder photo endpoint.
 *
 * Public URL forms (served at /photo/... via a rewrite to /api/photo/...):
 *   /photo/{size}                        random, redirects to an /id/ URL
 *   /photo/{width}/{height}              random, redirects to an /id/ URL
 *   /photo/id/{n}/{size}
 *   /photo/id/{n}/{width}/{height}
 *   /photo/seed/{seed}/{size}
 *   /photo/seed/{seed}/{width}/{height}
 *
 * The last numeric segment may carry an extension (`300.jpg`, `300.webp`).
 * Query params: `grayscale` (presence = on) and `blur` (bare = 1, else 1-10).
 */

export type PhotoFormat = "jpeg" | "webp";

export type PhotoQuery = Record<string, string | string[] | undefined>;

/**
 * Which photo in the manifest to serve: a catalog index (`/id/{n}`) or a
 * hashed seed (`/seed/{seed}`).
 */
export type PhotoSelector =
  | { type: "id"; id: number }
  | { type: "seed"; seed: string };

export interface PhotoRenderOptions {
  width: number;
  height: number;
  format: PhotoFormat;
  grayscale: boolean;
  blur: number | null;
}

export type PhotoTarget = Pick<
  PhotoRenderOptions,
  "width" | "height" | "format"
>;

export type ParsedPhotoRequest =
  | { kind: "error"; status: number; message: string }
  // Random requests carry only the target geometry: the route rebuilds the
  // redirect's query string from the raw request, so render options here
  // would be dead data.
  | ({ kind: "redirect-random" } & PhotoTarget)
  | ({ kind: "image"; selector: PhotoSelector } & PhotoRenderOptions);

export const MIN_SIZE = 1;
/**
 * Sources are 512x512, so anything much larger is pure upscale — and every
 * distinct size is its own sharp render, so the ceiling doubles as a compute
 * budget. 1600 still covers hero and OG dimensions.
 */
export const MAX_SIZE = 1600;
/** Counted in codepoints, not UTF-16 code units — see `sanitizeSeed`. */
export const MAX_SEED_LENGTH = 100;
export const MIN_BLUR = 1;
export const MAX_BLUR = 10;

export const USAGE_MESSAGE =
  "Usage: /photo/{size}, /photo/{width}/{height}, " +
  "/photo/id/{n}/{size}, /photo/id/{n}/{width}/{height}, " +
  "/photo/seed/{seed}/{size}, or /photo/seed/{seed}/{width}/{height}";

const SIZE_MESSAGE = `Size must be an integer between ${MIN_SIZE} and ${MAX_SIZE}. ${USAGE_MESSAGE}`;

const SIZE_SEGMENT_RE = /^(\d+)(?:\.([a-zA-Z0-9]+))?$/;

const EXTENSIONS: Record<string, PhotoFormat> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  webp: "webp",
};

/**
 * File extension used when building a canonical URL for a format.
 */
export function extensionForFormat(format: PhotoFormat): string {
  return format === "webp" ? "webp" : "jpg";
}

function error(status: number, message: string): ParsedPhotoRequest {
  return { kind: "error", status, message };
}

/**
 * A lone surrogate survives `Array.from` as a length-1 entry whose single
 * code unit sits in the surrogate range; a well-formed pair comes through as
 * a length-2 entry, so this leaves real astral characters alone.
 */
function isLoneSurrogate(codepoint: string): boolean {
  if (codepoint.length !== 1) {
    return false;
  }

  const unit = codepoint.charCodeAt(0);

  return unit >= 0xd800 && unit <= 0xdfff;
}

/**
 * Normalize a seed so that anything the parser returns is safe to hand back
 * to `encodeURIComponent` (which throws on a lone surrogate):
 *
 * - drop lone surrogates already present in the raw path segment
 * - cap by codepoint, so truncation can't split an astral character and
 *   create a new one
 *
 * Mirrors `sanitizeSeed` on the tool page. May return "", which the caller
 * treats as a missing seed.
 */
function sanitizeSeed(seed: string): string {
  const codepoints = Array.from(seed).filter(
    (codepoint) => !isLoneSurrogate(codepoint),
  );

  return codepoints.slice(0, MAX_SEED_LENGTH).join("");
}

/**
 * Next collapses repeated query params into arrays; only the last one wins.
 */
function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.length > 0 ? value[value.length - 1] : undefined;
  }

  return value;
}

function parseSizes(segments: string[]): PhotoTarget | ParsedPhotoRequest {
  if (segments.length !== 1 && segments.length !== 2) {
    return error(400, USAGE_MESSAGE);
  }

  const sizes: number[] = [];
  let format: PhotoFormat = "jpeg";

  for (let i = 0; i < segments.length; i++) {
    const isLast = i === segments.length - 1;
    const match = SIZE_SEGMENT_RE.exec(segments[i]);

    if (!match) {
      return error(400, SIZE_MESSAGE);
    }

    const [, digits, extension] = match;

    if (extension !== undefined) {
      // Only the trailing size segment may carry an extension.
      if (!isLast) {
        return error(400, SIZE_MESSAGE);
      }

      const resolved = EXTENSIONS[extension.toLowerCase()];

      if (!resolved) {
        return error(
          400,
          `Unsupported extension ".${extension}". Use .jpg or .webp`,
        );
      }

      format = resolved;
    }

    const size = Number(digits);

    if (!Number.isInteger(size) || size < MIN_SIZE || size > MAX_SIZE) {
      return error(400, SIZE_MESSAGE);
    }

    sizes.push(size);
  }

  const width = sizes[0];
  const height = sizes.length === 2 ? sizes[1] : sizes[0];

  return { width, height, format };
}

function parseBlur(
  query: PhotoQuery,
): { blur: number | null } | ParsedPhotoRequest {
  const raw = firstValue(query.blur);

  if (raw === undefined) {
    return { blur: null };
  }

  // `?blur` with no value means the default strength.
  const trimmed = raw.trim();

  if (trimmed === "") {
    return { blur: MIN_BLUR };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return error(
      400,
      `blur must be an integer between ${MIN_BLUR} and ${MAX_BLUR}`,
    );
  }

  return { blur: Math.max(MIN_BLUR, Math.min(MAX_BLUR, Number(trimmed))) };
}

/**
 * Parse the selector prefix (`/id/{n}` or `/seed/{seed}`) from the leading
 * segments. Returns null when the path has no selector prefix, meaning it is
 * a random request.
 */
function parseSelector(
  segments: string[],
): { selector: PhotoSelector; rest: string[] } | ParsedPhotoRequest | null {
  const prefix = segments[0].toLowerCase();

  if (prefix === "id") {
    const rawId = segments[1] ?? "";

    if (!/^\d+$/.test(rawId)) {
      return error(400, `Photo id must be a whole number. ${USAGE_MESSAGE}`);
    }

    const id = Number(rawId);

    if (!Number.isSafeInteger(id)) {
      return error(400, `Photo id must be a whole number. ${USAGE_MESSAGE}`);
    }

    return { selector: { type: "id", id }, rest: segments.slice(2) };
  }

  if (prefix === "seed") {
    // A seed of nothing but lone surrogates sanitizes down to "", which is
    // the same as not supplying one.
    const seed = sanitizeSeed(segments[1] ?? "");

    if (seed === "") {
      return error(400, `Missing seed. ${USAGE_MESSAGE}`);
    }

    return {
      selector: { type: "seed", seed },
      rest: segments.slice(2),
    };
  }

  return null;
}

/**
 * Parse a photo request into a render plan, a random redirect, or an error.
 * Unrecognized query params are ignored (clients pass cache busters like
 * `?random=2`).
 */
export function parsePhotoRequest(
  pathSegments: string[] | undefined,
  query: PhotoQuery = {},
): ParsedPhotoRequest {
  const segments = (pathSegments ?? []).filter((segment) => segment !== "");

  if (segments.length === 0) {
    return error(400, USAGE_MESSAGE);
  }

  const blurResult = parseBlur(query);

  if ("kind" in blurResult) {
    return blurResult;
  }

  const { blur } = blurResult;
  const grayscale = query.grayscale !== undefined;
  const selectorResult = parseSelector(segments);

  if (selectorResult === null) {
    const target = parseSizes(segments);

    if ("kind" in target) {
      return target;
    }

    return { kind: "redirect-random", ...target };
  }

  if ("kind" in selectorResult) {
    return selectorResult;
  }

  const target = parseSizes(selectorResult.rest);

  if ("kind" in target) {
    return target;
  }

  return {
    kind: "image",
    selector: selectorResult.selector,
    ...target,
    grayscale,
    blur,
  };
}

function buildPhotoPath(
  prefix: string,
  options: PhotoTarget,
  query: PhotoQuery,
): string {
  const path =
    `/photo/${prefix}` +
    `/${options.width}/${options.height}.${extensionForFormat(options.format)}`;
  const parts: string[] = [];

  for (const [key, value] of Object.entries(query)) {
    if (key === "path" || value === undefined) {
      continue;
    }

    for (const entry of Array.isArray(value) ? value : [value]) {
      parts.push(
        entry === ""
          ? encodeURIComponent(key)
          : `${encodeURIComponent(key)}=${encodeURIComponent(entry)}`,
      );
    }
  }

  return parts.length > 0 ? `${path}?${parts.join("&")}` : path;
}

/**
 * Build the canonical `/photo/id/{n}/...` URL a random request redirects to.
 * Query params are carried across verbatim (minus the catch-all `path` key
 * Next injects) so cache busters and unknown params survive the redirect.
 */
export function buildIdPhotoPath(
  id: number,
  options: PhotoTarget,
  query: PhotoQuery = {},
): string {
  return buildPhotoPath(`id/${id}`, options, query);
}

/**
 * Build the canonical `/photo/seed/{seed}/...` URL for a seed. Seeded URLs
 * are authored or shared rather than redirected to — random requests go to
 * `buildIdPhotoPath` — but query params carry across the same way.
 */
export function buildSeededPhotoPath(
  seed: string,
  options: PhotoTarget,
  query: PhotoQuery = {},
): string {
  return buildPhotoPath(`seed/${encodeURIComponent(seed)}`, options, query);
}

/**
 * FNV-1a (32-bit). Deterministic across runtimes, no dependencies.
 */
export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

/**
 * Map a seed onto an index in the photo manifest. Returns 0 for an empty
 * library so callers never index out of range.
 */
export function photoIndexForSeed(seed: string, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return hashSeed(seed) % count;
}
