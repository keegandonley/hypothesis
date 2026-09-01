/**
 * One-time source-image generation for the photo placeholder service.
 *
 * Generates photorealistic images with the Gemini API, slices each into 4
 * square quadrants, writes them to `public/photos/{id}.jpg`, and rewrites
 * `src/lib/photo-manifest.json` to match. Ids are positional — one SUBJECTS
 * entry owns four consecutive slice ids (`sceneIndex * 4 + quadrant`).
 *
 * SUBJECTS is therefore append-only: reordering or editing an existing entry
 * leaves the committed slices addressed by the wrong prompt.
 *
 * The slices are version-controlled, so git is the versioning story: a full
 * regen overwrites every slice in place and shows up as a reviewable diff, and
 * the manifest is always committed alongside the exact bytes it describes. A
 * full regen is one Gemini call per SUBJECTS entry and rewrites the whole
 * library, so prefer --append (below) unless you actually want to start over.
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
 * Pass `--append` to grow the library instead of rebuilding it. The committed
 * slices and their manifest entries stay byte-identical, and only the SUBJECTS
 * entries the manifest doesn't cover yet are generated, numbered on from the
 * end of the existing library. This is the cheap, low-churn way to add photos,
 * and it keeps every existing /photo/id/{n} URL pointing at the same image:
 *
 *   node scripts/generate-photos.mjs --append
 *
 * Pass `--limit N` to generate only the first N of the prompts the run would
 * otherwise cover — a cheap test pass to eyeball the output before paying for
 * the full set. A limited run still writes its slices to public/photos/, but
 * leaves src/lib/photo-manifest.json alone and dumps a preview manifest to
 * public/photos/manifest.preview.json instead, so a partial library can never
 * get committed:
 *
 *   node scripts/generate-photos.mjs --append --limit 1
 *
 * Every run ends with a perceptual near-duplicate scan over the whole resulting
 * library. It reports and never blocks: "too similar" is a taste call.
 */

import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CONCURRENCY = 4;
const MAX_ATTEMPTS = 3; // initial try + 2 retries
const QUADRANT_SIZE = 512;
const QUADRANTS_PER_IMAGE = 4;
const JPEG_QUALITY = 82;

/**
 * dHash geometry, and the distances at which two slices are called the same
 * picture. A dHash asks whether each pixel is darker than its right-hand
 * neighbour across a 9x8 greyscale downsample: 64 bits of coarse structure, so
 * the comparison survives resizing and colour shifts instead of being a byte
 * compare. Cross-scene pairs are the real duplicate check. Slices cut from one
 * source image are related by construction, so those are only flagged when
 * nearly interchangeable — which means a flat scene (empty sky, plain water)
 * yielded four redundant crops.
 *
 * Calibrated against the first 80 committed slices: the closest cross-scene
 * pair there sits at 10 (two slices that are both mostly open sky) and the
 * closest same-scene pair at 12. So 10 flags the genuine edge cases without
 * drowning the report, and 4 only fires on output that has actually collapsed.
 */
const DHASH_SIZE = 8;
const DUPLICATE_DISTANCE = 10;
const SIBLING_DUPLICATE_DISTANCE = 4;

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PHOTOS_DIR = path.join(REPO_ROOT, "public", "photos");
const MANIFEST_PATH = path.join(REPO_ROOT, "src", "lib", "photo-manifest.json");
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
  "Terraced rice paddies stepping down a steep hillside, flooded terraces catching reflected sky",
  "The crevassed blue ice face of a glacier, deep cracks and seracs in flat cold light",
  "Hot air balloons drifting over a wide valley at dawn, layered mist along the valley floor",
  "A vintage typewriter on a wooden desk beside scattered blank paper, low raking side light",
  "Stacked shipping containers at a container port, a dense grid of saturated rectangles",
  "A spiral staircase shot straight up through the middle, coils receding toward a bright center",
  "A library reading room with tall shelves and warm lamplight, long rows receding into the distance",
  "A flock of birds scattering across a pale overcast sky, small dark silhouettes",
  "Macro of frost crystals branching across a window pane, fine white patterns on cold glass",
  "A herd of wild horses running across an open plain, dust rising behind them",
  "Sunlight through a stained glass window casting colored patches across a worn stone floor",
  "Dark volcanic rock at the shoreline with long-exposure water smoothed to white mist",
  "A hillside vineyard in late summer, ordered rows of vines curving with the slope",
  "A market stall of spices in vivid conical mounds, deep red, ochre and turmeric yellow",
  "Steam rising from a mineral hot spring in a snowy landscape, pale blue water",
  "A single broad tree alone on a grassy hill under a vast sky of scattered cumulus",
  "An abstract macro of oil droplets on water, saturated overlapping circles",
  "A suspension bridge disappearing into thick fog, cables fading to grey",
  "Autumn leaves floating on the dark still surface of a pond",
  "The interior of a slot canyon, curved sandstone walls glowing orange in reflected light",
];

const PROMPTS = SUBJECTS.map((subject) => `${subject}. ${STYLE_SUFFIX}`);

/**
 * Reads `--append` and `--limit N` / `--limit=N` from argv. Only validates
 * shape here: how many prompts a `--limit` is allowed to cover depends on the
 * run's plan, which needs the manifest. Anything unrecognized is fatal — a typo
 * like `--limt 5` must not silently fall through to a full paid run.
 */
function parseArgs(argv) {
  const usage =
    "Usage: node scripts/generate-photos.mjs [--append] [--limit N]";
  let append = false;
  let limit = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--append") {
      append = true;
      continue;
    }

    if (arg === "--limit" || arg.startsWith("--limit=")) {
      const raw = arg.startsWith("--limit=")
        ? arg.slice("--limit=".length)
        : argv[++i];

      if (raw === undefined || !/^\d+$/.test(raw)) {
        console.error(
          `--limit needs a positive integer (got ${
            raw === undefined ? "nothing" : `"${raw}"`
          }). ${usage}`,
        );
        process.exit(1);
      }

      limit = Number(raw);
      continue;
    }

    console.error(`Unrecognized argument: ${arg}. ${usage}`);
    process.exit(1);
  }

  return { append, limit };
}

/** Range-checks a parsed `--limit` against what this run actually covers. */
function resolveLimit(limit, available) {
  if (limit === null) {
    return available;
  }

  if (limit < 1 || limit > available) {
    console.error(
      `--limit must be between 1 and ${available} for this run (got ${limit}).`,
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

  const runners = Array.from({ length: Math.min(limit, items.length) }, runner);

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

/**
 * Reads the committed manifest's photo list, which an append run treats as
 * immutable history.
 */
async function readManifestPhotos() {
  let raw;

  try {
    raw = await readFile(MANIFEST_PATH, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `--append needs an existing src/lib/photo-manifest.json, but it could not be read: ${message}`,
    );
  }

  const photos = JSON.parse(raw)?.photos;

  if (!Array.isArray(photos) || photos.length === 0) {
    throw new Error(
      "src/lib/photo-manifest.json has no photos to append to. Run without --append to build the library from scratch.",
    );
  }

  return photos;
}

/**
 * Works out what this run generates and where its slices land: a full rebuild
 * from prompt 0, or an append that keeps every committed slice and covers only
 * the subjects the manifest doesn't reach yet.
 */
async function planRun(append) {
  if (!append) {
    return { append: false, existingPhotos: [], promptOffset: 0, idBase: 0 };
  }

  const existingPhotos = await readManifestPhotos();

  if (existingPhotos.length % QUADRANTS_PER_IMAGE !== 0) {
    throw new Error(
      `The manifest holds ${existingPhotos.length} slices, which is not a whole number of ${QUADRANTS_PER_IMAGE}-quadrant images. Regenerate the library instead of appending to it.`,
    );
  }

  const sceneCount = existingPhotos.length / QUADRANTS_PER_IMAGE;

  if (sceneCount >= SUBJECTS.length) {
    throw new Error(
      `Nothing to append: the manifest already covers all ${SUBJECTS.length} subjects. Add new entries to the end of SUBJECTS first.`,
    );
  }

  // Ids are positional, so an append is only safe when the committed library is
  // exactly the first `sceneCount` subjects, in order. Matching on the subject
  // prefix rather than the full prompt keeps a later STYLE_SUFFIX edit from
  // masquerading as a reordering and forcing a full regen.
  existingPhotos.forEach((photo, index) => {
    if (photo.id !== String(index)) {
      throw new Error(
        `Manifest entry ${index} has id "${photo.id}", expected "${index}". Appending needs ids contiguous from 0 — regenerate the library instead.`,
      );
    }

    const sceneIndex = Math.floor(index / QUADRANTS_PER_IMAGE);
    const subject = SUBJECTS[sceneIndex];

    if (typeof photo.prompt !== "string" || !photo.prompt.startsWith(subject)) {
      throw new Error(
        `Manifest entry ${index} was not generated from SUBJECTS[${sceneIndex}]. SUBJECTS must stay append-only: reordering or editing an existing entry leaves the committed slices pointing at the wrong prompt. Regenerate the library instead.`,
      );
    }
  });

  // Proven here, before requireEnv and before a single paid generation: a
  // committed slice that has gone missing would otherwise surface only in the
  // duplicate scan, i.e. after the Gemini batch is already paid for, and the
  // retry would buy the same images a second time.
  await Promise.all(
    existingPhotos.map(async (photo) => {
      const file = path.join(PHOTOS_DIR, path.basename(photo.path));

      try {
        await access(file, constants.R_OK);
      } catch {
        throw new Error(
          `Manifest entry ${photo.id} points at ${file}, which is missing or unreadable. Restore the committed slices (\`git checkout -- public/photos\`) before appending.`,
        );
      }
    }),
  );

  return {
    append: true,
    existingPhotos,
    promptOffset: sceneCount,
    idBase: existingPhotos.length,
  };
}

/**
 * 64-bit dHash: greyscale, squash to (DHASH_SIZE + 1) x DHASH_SIZE, then record
 * whether each pixel is darker than its right-hand neighbour.
 */
async function perceptualHash(buffer) {
  const pixels = await sharp(buffer)
    .greyscale()
    .resize(DHASH_SIZE + 1, DHASH_SIZE, { fit: "fill" })
    .raw()
    .toBuffer();

  const bits = new Uint8Array(DHASH_SIZE * DHASH_SIZE);

  for (let row = 0; row < DHASH_SIZE; row++) {
    for (let col = 0; col < DHASH_SIZE; col++) {
      const offset = row * (DHASH_SIZE + 1) + col;

      bits[row * DHASH_SIZE + col] =
        pixels[offset] < pixels[offset + 1] ? 1 : 0;
    }
  }

  return bits;
}

function hammingDistance(a, b) {
  let distance = 0;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      distance++;
    }
  }

  return distance;
}

/** Fingerprints already-committed slices straight off disk. */
function hashExistingPhotos(existingPhotos) {
  return mapWithConcurrency(existingPhotos, CONCURRENCY, async (photo) => ({
    id: photo.id,
    sceneIndex: Math.floor(Number(photo.id) / QUADRANTS_PER_IMAGE),
    hash: await perceptualHash(
      await readFile(path.join(PHOTOS_DIR, path.basename(photo.path))),
    ),
  }));
}

/** Every pair of slices whose fingerprints are close enough to read as one picture. */
function findNearDuplicates(entries) {
  const pairs = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const sameSource = entries[i].sceneIndex === entries[j].sceneIndex;
      const distance = hammingDistance(entries[i].hash, entries[j].hash);
      const threshold = sameSource
        ? SIBLING_DUPLICATE_DISTANCE
        : DUPLICATE_DISTANCE;

      if (distance <= threshold) {
        pairs.push({
          a: entries[i].id,
          b: entries[j].id,
          distance,
          sameSource,
        });
      }
    }
  }

  return pairs.sort((x, y) => x.distance - y.distance);
}

/**
 * Prints the scan. Deliberately advisory: whether two photos are "the same" is
 * a judgement call, so a hit never blocks the manifest write.
 */
function reportNearDuplicates(pairs, newIds) {
  const crossScene = pairs.filter((pair) => !pair.sameSource);
  const sameScene = pairs.filter((pair) => pair.sameSource);

  console.log(
    `Near-duplicate scan: ${crossScene.length} cross-scene pair(s) within ${DUPLICATE_DISTANCE}/64, ${sameScene.length} same-scene pair(s) within ${SIBLING_DUPLICATE_DISTANCE}/64.`,
  );

  for (const pair of crossScene) {
    const committed =
      !newIds.has(pair.a) && !newIds.has(pair.b)
        ? " (both already committed)"
        : "";

    console.warn(
      `  [duplicate] ${pair.a}.jpg and ${pair.b}.jpg differ by only ${pair.distance}/64${committed}`,
    );
  }

  for (const pair of sameScene) {
    console.warn(
      `  [flat scene] ${pair.a}.jpg and ${pair.b}.jpg are crops of one image and differ by only ${pair.distance}/64`,
    );
  }

  if (pairs.length > 0) {
    console.warn(
      "  Nothing was blocked. If these read as the same photo, swap the subject and re-run.",
    );
  }

  return { crossScene: crossScene.length, sameScene: sameScene.length };
}

async function main() {
  const { append, limit: requestedLimit } = parseArgs(process.argv.slice(2));
  const plan = await planRun(append);
  const available = PROMPTS.slice(plan.promptOffset);
  const limit = resolveLimit(requestedLimit, available.length);
  const isPartial = limit < available.length;
  const prompts = available.slice(0, limit);
  const apiKey = requireEnv("GEMINI_API_KEY");

  if (plan.append) {
    console.log(
      `APPEND RUN — the ${plan.existingPhotos.length} committed slices stay exactly as they are; new slices start at id ${plan.idBase}.`,
    );
  }

  if (isPartial) {
    console.log(
      `PARTIAL TEST RUN — only the first ${limit} of the ${available.length} prompt(s) this run covers.`,
    );
    console.log(
      "src/lib/photo-manifest.json will NOT be touched; a preview manifest goes to public/photos/manifest.preview.json.",
    );
  }

  if (plan.append || isPartial) {
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
      (Date.now() - startedAt) /
      1000
    ).toFixed(1)}s — billable image generations: ${images.length}`,
  );

  await mkdir(PHOTOS_DIR, { recursive: true });

  console.log(
    `Slicing and writing ${images.length * QUADRANTS_PER_IMAGE} quadrants to public/photos/...`,
  );

  const photoGroups = await mapWithConcurrency(
    images,
    CONCURRENCY,
    async (buffer, imageIndex) => {
      const quadrants = await sliceIntoQuadrants(buffer);
      const sceneIndex = plan.promptOffset + imageIndex;
      const photos = [];
      const hashes = [];
      let bytes = 0;

      for (let q = 0; q < quadrants.length; q++) {
        const id = String(plan.idBase + imageIndex * QUADRANTS_PER_IMAGE + q);

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
          prompt: PROMPTS[sceneIndex],
        });
        hashes.push({
          id,
          sceneIndex,
          hash: await perceptualHash(quadrants[q]),
        });
      }

      return { photos, hashes, bytes };
    },
  );

  const newPhotos = photoGroups.flatMap((group) => group.photos);
  const totalBytes = photoGroups.reduce((sum, group) => sum + group.bytes, 0);
  const photos = [...plan.existingPhotos, ...newPhotos].sort(
    (a, b) => Number(a.id) - Number(b.id),
  );

  console.log("");
  console.log(`Fingerprinting ${photos.length} slices for near-duplicates...`);

  const duplicates = reportNearDuplicates(
    findNearDuplicates([
      ...(await hashExistingPhotos(plan.existingPhotos)),
      ...photoGroups.flatMap((group) => group.hashes),
    ]),
    new Set(newPhotos.map((photo) => photo.id)),
  );

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
  console.log(`  Slices written:          ${newPhotos.length}`);
  console.log(`  Library size:            ${photos.length}`);
  console.log(`  Slice size:              ${QUADRANT_SIZE}x${QUADRANT_SIZE}`);
  console.log(
    `  New slices on disk:      ${(totalBytes / 1024 / 1024).toFixed(1)} MB (committed to git)`,
  );
  console.log(
    `  Near-duplicate pairs:    ${duplicates.crossScene} cross-scene, ${duplicates.sameScene} same-scene`,
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
      `This was a test pass over ${limit} of ${available.length} prompt(s). src/lib/photo-manifest.json is untouched.`,
    );
    console.log(
      plan.append
        ? "Eyeball the slices above, then discard the new ones with `git clean -f public/photos` — an append run's slices are untracked, so `git checkout` will not remove them."
        : "Eyeball the slices above, then discard them with `git checkout -- public/photos` (or `git clean -fd public/photos`).",
    );
    console.log(
      "Re-run without --limit for the real pass. Do not commit a partial library.",
    );

    return;
  }

  console.log("Review the diff with `git status` / `git diff` and commit.");
}

main().catch((error) => {
  console.error("");
  console.error(
    "Run failed — the manifest was NOT rewritten. Any slice files this run wrote show up in `git status`: discard modified ones with `git checkout -- public/photos` and new untracked ones with `git clean -f public/photos`.",
  );
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
