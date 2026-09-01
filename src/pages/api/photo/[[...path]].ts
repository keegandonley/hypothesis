import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import photoManifest from "@/lib/photo-manifest.json";
import {
  RASTER_RENDER_CAP,
  renderPatternSvg,
  type PatternStyle,
} from "@/lib/photo-pattern";
import {
  buildIdPhotoPath,
  hashSeed,
  parsePhotoRequest,
  photoIndexForSeed,
  type PhotoFormat,
} from "@/lib/photo-url";

interface PhotoEntry {
  id: string;
  /** Root-relative path under public/, e.g. `/photos/0.jpg`. */
  path: string;
  width: number;
  height: number;
  prompt?: string;
}

interface PhotoManifest {
  version: number;
  generatedAt: string | null;
  photos: PhotoEntry[];
}

export const config = {
  api: {
    responseLimit: "10mb",
  },
};

const manifest = photoManifest as PhotoManifest;

const CONTENT_TYPES: Record<PhotoFormat, string> = {
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml; charset=utf-8",
};

/**
 * Defence in depth for procedural responses. `photo-pattern` never puts the
 * user-controlled seed into the document and never emits script, but an SVG
 * served from our own origin becomes a script context if someone navigates
 * straight to the URL, so the response refuses to load anything regardless.
 * CSP on an image subresource is ignored by browsers, so this costs `<img>`
 * usage nothing.
 */
const SVG_CSP = "default-src 'none'; style-src 'unsafe-inline'; sandbox";

const QUALITY = 80;

// The blur=1..10 scale reads roughly like a gaussian sigma of the same value,
// and sharp's .blur() takes sigma directly, so the mapping is 1:1.
const BLUR_SIGMA_PER_STEP = 1;

const IMAGE_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=31536000, immutable";

const ALLOWED_METHODS = "GET, HEAD, OPTIONS";

const ORIGIN_FETCH_TIMEOUT_MS = 10_000;

/**
 * Gen mode has no catalog id, so Photo-ID reports the style plus a hash of the
 * seed. The raw seed is deliberately kept out of the header.
 */
function genPhotoId(style: string, seed: string): string {
  return `gen-${style}-${hashSeed(seed).toString(36)}`.replace(/[^\w.-]/g, "_");
}

/**
 * Source slices live in public/ and are served by the static CDN layer, so
 * the function fetches them back through its own origin rather than off disk
 * (public/ isn't available to serverless functions via fs).
 *
 * Vercel sets x-forwarded-proto; `next dev` sets nothing, so a local host
 * falls back to http instead of https. Returns null when Host is missing.
 */
function originFromRequest(req: NextApiRequest): string | null {
  const host = req.headers.host;

  if (!host) {
    return null;
  }

  const forwarded = req.headers["x-forwarded-proto"];
  // The header can be a list ("https,http") behind chained proxies.
  const forwardedProto = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(",")[0]
    .trim();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.");
  const proto = forwardedProto || (isLocal ? "http" : "https");

  return `${proto}://${host}`;
}

/**
 * Rasterize a pattern SVG to JPEG or WebP.
 *
 * Most styles go straight through librsvg. `noise` does not: feTurbulence is
 * evaluated per output pixel and scales superlinearly (~211ms for a 1600x1600
 * JPEG, against ~10ms for a gradient). For those styles the SAME document is
 * rendered at reduced density and the resulting bitmap is scaled up, which
 * costs ~48ms at 1600x1600 and is visually indistinguishable on a noise field.
 *
 * The scale-up has to be a second pass over a raster: sharp re-renders vector
 * input at the resize target, so doing it in one pipeline would render at full
 * size anyway and save nothing.
 */
async function rasterizePattern(
  svg: string,
  style: PatternStyle,
  target: { width: number; height: number; format: "jpeg" | "webp" },
): Promise<Buffer> {
  const svgBuffer = Buffer.from(svg);
  const cap = RASTER_RENDER_CAP[style];
  const longest = Math.max(target.width, target.height);
  const shortest = Math.min(target.width, target.height);
  const scale = cap === null ? 1 : cap / longest;
  // Density scales BOTH axes, so on a thin canvas the minor axis can collapse
  // to zero and librsvg refuses the document ("zero-sized image"). Fall back to
  // a full-resolution render when that would happen — safe by construction,
  // because a canvas thin enough to trigger it has a trivial pixel area, and
  // area is what the reduced render exists to bound.
  const minorSurvives = Math.floor(shortest * scale) >= 1;
  let pipeline: sharp.Sharp;

  if (cap !== null && longest > cap && minorSurvives) {
    // librsvg sizes an SVG with explicit pixel dimensions by density/72, so a
    // reduced density renders the same document smaller.
    const base = await sharp(svgBuffer, { density: (72 * cap) / longest })
      .png()
      .toBuffer();

    pipeline = sharp(base).resize(target.width, target.height, { fit: "fill" });
  } else {
    pipeline = sharp(svgBuffer);
  }

  return target.format === "webp"
    ? pipeline.webp({ quality: QUALITY }).toBuffer()
    : pipeline.jpeg({ quality: QUALITY }).toBuffer();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  // The QA harness fetches cross-origin, so every response carries ACAO —
  // plus the expose header, without which cross-origin JS can't read Photo-ID.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Photo-ID");

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ALLOWED_METHODS);
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();

    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ALLOWED_METHODS);
    res.status(405).json({ error: "Method not allowed" });

    return;
  }

  const rawPath = req.query.path;
  const pathSegments = Array.isArray(rawPath)
    ? rawPath
    : typeof rawPath === "string"
      ? [rawPath]
      : undefined;
  const parsed = parsePhotoRequest(pathSegments, req.query);

  if (parsed.kind === "error") {
    res.setHeader("Cache-Control", "no-cache");
    res.status(parsed.status).json({ error: parsed.message });

    return;
  }

  // Procedural requests short-circuit everything below: no manifest lookup, no
  // origin fetch, no source decode. In SVG form they don't touch sharp at all,
  // which is the whole point of the mode — the response is a built string.
  // This also means gen mode keeps working when the photo library is empty.
  if (parsed.kind === "image" && parsed.selector.type === "gen") {
    const { seed, style } = parsed.selector;
    const svg = renderPatternSvg({
      seed,
      width: parsed.width,
      height: parsed.height,
      style,
      grayscale: parsed.grayscale,
      blur: parsed.blur,
    });

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", IMAGE_CACHE_CONTROL);
    res.setHeader("Photo-ID", genPhotoId(style, seed));

    if (parsed.format === "svg") {
      res.setHeader("Content-Type", CONTENT_TYPES.svg);
      res.setHeader("Content-Security-Policy", SVG_CSP);
      // No Content-Length: Next sizes the body itself, and a naive string
      // length would be wrong the moment the document holds multi-byte text.
      res.status(200).send(svg);

      return;
    }

    let patternBuffer: Buffer;

    try {
      patternBuffer = await rasterizePattern(svg, style, {
        width: parsed.width,
        height: parsed.height,
        format: parsed.format,
      });
    } catch (err) {
      console.error("Pattern rasterization failed:", err);

      res.setHeader("Cache-Control", "no-cache");
      res.status(500).json({ error: "Pattern rasterization failed" });

      return;
    }

    res.setHeader("Content-Type", CONTENT_TYPES[parsed.format]);
    res.setHeader("Content-Length", String(patternBuffer.length));
    res.status(200).send(patternBuffer);

    return;
  }

  if (manifest.photos.length === 0) {
    res.setHeader("Cache-Control", "no-cache");
    res.status(503).json({ error: "photo library not generated yet" });

    return;
  }

  // Random requests never render bytes: they bounce to an /id/ URL drawn from
  // the catalog, so the set of renderable URLs stays bounded by the manifest
  // and repeat traffic hits the CDN instead of sharp.
  if (parsed.kind === "redirect-random") {
    const id = Math.floor(Math.random() * manifest.photos.length);

    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Location", buildIdPhotoPath(id, parsed, req.query));
    res.status(302).end();

    return;
  }

  if (
    parsed.selector.type === "id" &&
    parsed.selector.id >= manifest.photos.length
  ) {
    res.setHeader("Cache-Control", "no-cache");
    res.status(404).json({
      error: `No photo with id ${parsed.selector.id}. The library holds ${manifest.photos.length} photos (ids 0-${manifest.photos.length - 1})`,
    });

    return;
  }

  // Only `id` and `seed` selectors reach here — gen returned above. TypeScript
  // can't narrow that out (the early return tests two discriminants at once),
  // so treat a non-`id` selector as a seed rather than adding a dead branch.
  const photo =
    parsed.selector.type === "id"
      ? manifest.photos[parsed.selector.id]
      : manifest.photos[
          photoIndexForSeed(parsed.selector.seed, manifest.photos.length)
        ];

  if (!photo) {
    res.setHeader("Cache-Control", "no-cache");
    res.status(503).json({ error: "photo library not generated yet" });

    return;
  }

  const origin = originFromRequest(req);

  if (origin === null) {
    res.setHeader("Cache-Control", "no-cache");
    res.status(500).json({ error: "Unable to resolve request origin" });

    return;
  }

  let inputBuffer: Buffer;

  try {
    const response = await fetch(`${origin}${photo.path}`, {
      signal: AbortSignal.timeout(ORIGIN_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      res.setHeader("Cache-Control", "no-cache");
      res.status(502).json({ error: "Failed to fetch source photo" });

      return;
    }

    inputBuffer = Buffer.from(await response.arrayBuffer());
  } catch (err) {
    console.error("Photo fetch failed:", err);

    res.setHeader("Cache-Control", "no-cache");
    res.status(502).json({ error: "Failed to fetch source photo" });

    return;
  }

  let outputBuffer: Buffer;

  try {
    let pipeline = sharp(inputBuffer).resize(parsed.width, parsed.height, {
      fit: "cover",
    });

    if (parsed.grayscale) {
      pipeline = pipeline.grayscale();
    }

    if (parsed.blur !== null) {
      pipeline = pipeline.blur(parsed.blur * BLUR_SIGMA_PER_STEP);
    }

    outputBuffer =
      parsed.format === "webp"
        ? await pipeline.webp({ quality: QUALITY }).toBuffer()
        : await pipeline.jpeg({ quality: QUALITY }).toBuffer();
  } catch (err) {
    console.error("Photo processing failed:", err);

    res.setHeader("Cache-Control", "no-cache");
    res.status(500).json({ error: "Photo processing failed" });

    return;
  }

  res.setHeader("Content-Type", CONTENT_TYPES[parsed.format]);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Length", String(outputBuffer.length));
  res.setHeader("Cache-Control", IMAGE_CACHE_CONTROL);
  res.setHeader("Photo-ID", photo.id.replace(/[^\w.-]/g, "_"));
  res.status(200).send(outputBuffer);
}
