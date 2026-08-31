/**
 * One-time source-image generation for the photo placeholder service.
 *
 * Generates 20 photorealistic images with the Gemini API, slices each into 4
 * square quadrants (80 slices total), writes them to `public/photos/{0..79}.jpg`,
 * and rewrites `src/lib/photo-manifest.json` to match.
 *
 * The slices are version-controlled, so git is the versioning story: a regen
 * overwrites the same 80 files in place and shows up as a reviewable diff, and
 * the manifest is always committed alongside the exact bytes it describes.
 *
 * Run locally (never in CI — it costs real Gemini credits):
 *
 *   node scripts/generate-photos.mjs
 *
 * GEMINI_API_KEY is read from the environment. If you keep it in .env.local
 * rather than your shell, run it as:
 *
 *   node --env-file=.env.local scripts/generate-photos.mjs
 *
 * Pass `--limit N` to generate only the first N prompts — a cheap test pass to
 * eyeball the output before paying for all 20. A limited run still writes its
 * slices to public/photos/, but leaves src/lib/photo-manifest.json alone and
 * dumps a preview manifest to public/photos/manifest.preview.json instead, so
 * a partial library can never get committed:
 *
 *   node scripts/generate-photos.mjs --limit 1
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CONCURRENCY = 4;
const MAX_ATTEMPTS = 3; // initial try + 2 retries
const QUADRANT_SIZE = 512;
const JPEG_QUALITY = 82;

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PHOTOS_DIR = path.join(REPO_ROOT, "public", "photos");
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "src",
  "lib",
  "photo-manifest.json",
);
const PREVIEW_MANIFEST_PATH = path.join(PHOTOS_DIR, "manifest.preview.json");

const STYLE_SUFFIX =
  "Photorealistic photograph, natural lighting, sharp focus, high detail. " +
  "No text, no lettering, no logos, no watermarks, no borders. " +
  "No recognizable human faces.";

const SUBJECTS = [
  "A dramatic mountain range at sunrise, layered ridgelines fading into morning haze, patches of snow near the peaks",
  "An empty sandy beach at golden hour, gentle surf rolling in, wet sand reflecting a warm sky",
  "A dense evergreen forest floor, shafts of light through the canopy, moss and ferns covering fallen logs",
  "A rain-slicked city street at dusk, neon reflections on the pavement, blurred traffic lights receding into the distance",
  "A modern concrete and glass building facade, strong geometric shadows, shot from below against a clear sky",
  "An overhead flat lay of a rustic dinner spread on a weathered wood table, roasted vegetables and fresh herbs",
  "A ceramic cup of espresso on a marble counter, steam curling upward, shallow depth of field",
  "A red fox standing alert in tall dry grass, early morning light, softly blurred background",
  "Rolling sand dunes in a desert at midday, wind-carved ripples, deep shadows along the crests",
  "A still alpine lake reflecting surrounding pine trees and cloud, perfectly mirrored surface",
  "A close-up of a wildflower meadow, purple and yellow blooms, soft bokeh behind the nearest petals",
  "An extreme close-up of weathered rust and peeling paint on a metal surface, rich orange and teal texture",
  "The Milky Way over a dark desert horizon, dense starfield, faint airglow near the ground",
  "A narrow cobblestone alley in an old European town, ivy on stone walls, warm lamplight",
  "Aerial top-down view of a winding river cutting through autumn forest, orange and gold canopy",
  "Storm clouds gathering over open farmland, a single dirt road leading toward the horizon",
  "A tropical waterfall spilling into a clear pool, lush green foliage, mist in the air",
  "A snow-covered pine forest in flat overcast light, tracks winding between the trees",
  "A weathered wooden fishing boat moored in calm harbor water at dawn, soft pastel sky",
  "A close-up of tropical monstera and palm leaves, deep green, water droplets catching the light",
];

const PROMPTS = SUBJECTS.map((subject) => `${subject}. ${STYLE_SUFFIX}`);

/**
 * Reads `--limit N` / `--limit=N` from argv. Returns the full prompt count when
 * the flag is absent. Exits on anything that isn't a positive integer within
 * range, rather than silently generating the wrong number of images.
 */
function parseLimit(argv) {
  const index = argv.findIndex(
    (arg) => arg === "--limit" || arg.startsWith("--limit="),
  );

  if (index === -1) {
    if (argv.length > 0) {
      console.error(
        `Unrecognized argument(s): ${argv.join(" ")}. Usage: node scripts/generate-photos.mjs [--limit N]`,
      );
      process.exit(1);
    }

    return PROMPTS.length;
  }

  const raw = argv[index].startsWith("--limit=")
    ? argv[index].slice("--limit=".length)
    : argv[index + 1];

  if (raw === undefined || !/^\d+$/.test(raw)) {
    console.error(
      `--limit needs a positive integer between 1 and ${PROMPTS.length} (got ${
        raw === undefined ? "nothing" : `"${raw}"`
      }).`,
    );
    process.exit(1);
  }

  const limit = Number(raw);

  if (limit < 1 || limit > PROMPTS.length) {
    console.error(
      `--limit must be between 1 and ${PROMPTS.length} (got ${limit}).`,
    );
    process.exit(1);
  }

  // Reject anything we didn't consume. --limit exists to keep a test pass cheap,
  // so a typo like `--limt 5` must not silently fall through to all 20 images.
  const consumed = argv[index].startsWith("--limit=")
    ? [argv[index]]
    : [argv[index], argv[index + 1]];
  const unknown = argv.filter((arg) => !consumed.includes(arg));

  if (unknown.length > 0) {
    console.error(
      `Unrecognized argument(s): ${unknown.join(" ")}. Usage: node scripts/generate-photos.mjs [--limit N]`,
    );
    process.exit(1);
  }

  return limit;
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    console.error(
      `Missing ${name}. Set it in your shell, or run: node --env-file=.env.local scripts/generate-photos.mjs`,
    );
    process.exit(1);
  }

  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `worker` over every item with at most `limit` in flight at once.
 * Rejects as soon as any worker throws.
 */
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    while (nextIndex < items.length) {
      const index = nextIndex++;

      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    runner,
  );

  await Promise.all(runners);

  return results;
}

/** One Gemini call. Returns the raw image bytes, or throws with a readable message. */
async function requestImage(apiKey, prompt) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "1:1" },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Gemini responded ${response.status}: ${body.slice(0, 500)}`,
    );
  }

  const payload = await response.json();
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part?.inlineData?.data);

  if (!imagePart) {
    const finishReason = payload?.candidates?.[0]?.finishReason ?? "unknown";
    const blockReason = payload?.promptFeedback?.blockReason;

    throw new Error(
      `Gemini returned no image data (finishReason=${finishReason}${
        blockReason ? `, blockReason=${blockReason}` : ""
      })`,
    );
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}

async function generateImage(apiKey, prompt, index) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const buffer = await requestImage(apiKey, prompt);

      console.log(
        `  [image ${index}] generated (${(buffer.length / 1024).toFixed(0)} KB)${
          attempt > 1 ? ` on attempt ${attempt}` : ""
        }`,
      );

      return buffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (attempt === MAX_ATTEMPTS) {
        throw new Error(
          `Image ${index} failed after ${MAX_ATTEMPTS} attempts: ${message}`,
        );
      }

      console.warn(
        `  [image ${index}] attempt ${attempt} failed, retrying: ${message}`,
      );
      await sleep(1000 * attempt);
    }
  }
}

/**
 * Center-crops to the largest square, normalizes to 2x the quadrant size, then
 * cuts the 4 quadrants. Order: top-left, top-right, bottom-left, bottom-right.
 */
async function sliceIntoQuadrants(buffer) {
  const metadata = await sharp(buffer).metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    throw new Error("Generated image has no readable dimensions");
  }

  const side = QUADRANT_SIZE * 2;
  const square = await sharp(buffer)
    .resize(side, side, { fit: "cover", position: "centre" })
    .toBuffer();

  const offsets = [
    { left: 0, top: 0 },
    { left: QUADRANT_SIZE, top: 0 },
    { left: 0, top: QUADRANT_SIZE },
    { left: QUADRANT_SIZE, top: QUADRANT_SIZE },
  ];

  return Promise.all(
    offsets.map(({ left, top }) =>
      sharp(square)
        .extract({ left, top, width: QUADRANT_SIZE, height: QUADRANT_SIZE })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer(),
    ),
  );
}

async function main() {
  const limit = parseLimit(process.argv.slice(2));
  const isPartial = limit < PROMPTS.length;
  const prompts = PROMPTS.slice(0, limit);
  const apiKey = requireEnv("GEMINI_API_KEY");

  if (isPartial) {
    console.log(
      `PARTIAL TEST RUN — only the first ${limit} of ${PROMPTS.length} prompts.`,
    );
    console.log(
      `src/lib/photo-manifest.json will NOT be touched; a preview manifest goes to public/photos/manifest.preview.json.`,
    );
    console.log("");
  }

  console.log(
    `Generating ${prompts.length} images with ${MODEL} (concurrency ${CONCURRENCY})...`,
  );

  const startedAt = Date.now();
  const images = await mapWithConcurrency(
    prompts,
    CONCURRENCY,
    (prompt, index) => generateImage(apiKey, prompt, index),
  );

  console.log(
    `Generated ${images.length} Gemini images in ${(
      (Date.now() - startedAt) / 1000
    ).toFixed(1)}s — billable image generations: ${images.length}`,
  );

  await mkdir(PHOTOS_DIR, { recursive: true });

  console.log(
    `Slicing and writing ${images.length * 4} quadrants to public/photos/...`,
  );

  const photoGroups = await mapWithConcurrency(
    images,
    CONCURRENCY,
    async (buffer, imageIndex) => {
      const quadrants = await sliceIntoQuadrants(buffer);
      const photos = [];
      let bytes = 0;

      for (let q = 0; q < quadrants.length; q++) {
        const id = String(imageIndex * 4 + q);

        await writeFile(path.join(PHOTOS_DIR, `${id}.jpg`), quadrants[q]);
        bytes += quadrants[q].length;

        console.log(
          `  [slice ${id}] wrote public/photos/${id}.jpg (${(
            quadrants[q].length / 1024
          ).toFixed(0)} KB)`,
        );

        photos.push({
          id,
          path: `/photos/${id}.jpg`,
          width: QUADRANT_SIZE,
          height: QUADRANT_SIZE,
          prompt: PROMPTS[imageIndex],
        });
      }

      return { photos, bytes };
    },
  );

  const photos = photoGroups.flatMap((group) => group.photos);
  const totalBytes = photoGroups.reduce((sum, group) => sum + group.bytes, 0);

  photos.sort((a, b) => Number(a.id) - Number(b.id));

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    photos,
  };
  const manifestTarget = isPartial ? PREVIEW_MANIFEST_PATH : MANIFEST_PATH;

  await writeFile(manifestTarget, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log("");
  console.log(isPartial ? "Done (PARTIAL TEST RUN)." : "Done.");
  console.log(`  Gemini images generated: ${images.length}`);
  console.log(`  Slices written:          ${photos.length}`);
  console.log(`  Slice size:              ${QUADRANT_SIZE}x${QUADRANT_SIZE}`);
  console.log(
    `  Total on disk:           ${(totalBytes / 1024 / 1024).toFixed(1)} MB (committed to git)`,
  );
  console.log(`  Output directory:        ${PHOTOS_DIR}`);
  console.log(`  Manifest:                ${manifestTarget}`);
  console.log(
    `  Total time:              ${((Date.now() - startedAt) / 1000).toFixed(
      1,
    )}s`,
  );
  console.log("");

  if (isPartial) {
    console.log(
      `This was a test pass over ${limit} of ${PROMPTS.length} prompts. src/lib/photo-manifest.json is untouched.`,
    );
    console.log(
      "Eyeball the slices above, then discard them with `git checkout -- public/photos` (or `git clean -fd public/photos`)",
    );
    console.log(
      "and re-run without --limit for the real pass. Do not commit a partial library.",
    );

    return;
  }

  console.log("Review the diff with `git status` / `git diff` and commit.");
}

main().catch((error) => {
  console.error("");
  console.error(
    "Run failed — the manifest was NOT rewritten. Any slice files this run wrote show up in `git status` and can be discarded with `git checkout -- public/photos`.",
  );
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
