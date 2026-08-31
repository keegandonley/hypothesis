import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import photoManifest from "@/lib/photo-manifest.json";
import {
  buildIdPhotoPath,
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
};

const QUALITY = 80;

// The blur=1..10 scale reads roughly like a gaussian sigma of the same value,
// and sharp's .blur() takes sigma directly, so the mapping is 1:1.
const BLUR_SIGMA_PER_STEP = 1;

const IMAGE_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=31536000, immutable";

const ALLOWED_METHODS = "GET, HEAD, OPTIONS";

const ORIGIN_FETCH_TIMEOUT_MS = 10_000;

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

  if (manifest.photos.length === 0) {
    res.setHeader("Cache-Control", "no-cache");
    res.status(503).json({ error: "photo library not generated yet" });

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
  res.setHeader("Content-Length", String(outputBuffer.length));
  res.setHeader("Cache-Control", IMAGE_CACHE_CONTROL);
  res.setHeader("Photo-ID", photo.id.replace(/[^\w.-]/g, "_"));
  res.status(200).send(outputBuffer);
}
