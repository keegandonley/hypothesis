import { useEffect, useState } from "react";
import styles from "@/styles/photo.module.css";
import {
  Button,
  CopyButton,
  PageLayout,
  PanelHeader,
  PermalinkRow,
} from "@/components/ui";
import { useBranding } from "@/lib/branding";
import {
  DEFAULT_PATTERN_STYLE,
  PATTERN_STYLES,
  type PatternStyle,
  isPatternStyle,
} from "@/lib/photo-pattern";
import {
  MAX_BLUR,
  MAX_SEED_LENGTH,
  MAX_SIZE,
  MIN_SIZE,
  type PhotoFormat,
  extensionForFormat,
} from "@/lib/photo-url";
import { useUrlSync } from "@/lib/useUrlSync";

/**
 * `photo` crops the AI-generated photo library; `gen` builds an SVG from the
 * seed. They share every control except style, and each has its own default
 * format and seed rule — see `normalize`.
 */
type PhotoMode = "photo" | "gen";

interface Settings {
  mode: PhotoMode;
  width: number;
  height: number;
  seed: string;
  grayscale: boolean;
  blur: number;
  format: PhotoFormat;
  style: PatternStyle;
}

const DEFAULT: Settings = {
  mode: "photo",
  width: 600,
  height: 400,
  seed: "",
  grayscale: false,
  blur: 0,
  format: "jpeg",
  style: DEFAULT_PATTERN_STYLE,
};

const clampSize = (n: number): number =>
  Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(n)));

const clampBlur = (n: number): number =>
  Math.max(0, Math.min(MAX_BLUR, Math.round(n)));

/**
 * `Array.from` keeps surrogate pairs together, so any length-1 entry left in
 * the surrogate range is unpaired.
 */
const isLoneSurrogate = (ch: string): boolean => {
  if (ch.length !== 1) return false;

  const code = ch.charCodeAt(0);

  return code >= 0xd800 && code <= 0xdfff;
};

/**
 * Trim to the API's seed limit by codepoint, not by UTF-16 code unit: a
 * `String.slice` (and the input's `maxLength`) can cut an astral character in
 * half, and `encodeURIComponent` throws `URIError` on the unpaired surrogate
 * that leaves behind — which would take the whole page down on render.
 */
function sanitizeSeed(raw: string): string {
  return Array.from(raw)
    .filter((ch) => !isLoneSurrogate(ch))
    .slice(0, MAX_SEED_LENGTH)
    .join("");
}

/**
 * Short alphanumeric seed for the Shuffle button, and for the seed procedural
 * mode requires.
 */
function randomSeed(): string {
  const bytes = new Uint8Array(6);

  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join(
    "",
  );
}

/**
 * Repair the two combinations the URL grammar has no spelling for. Every
 * settings change funnels through here, so no sequence of toggles and no
 * hand-edited permalink can leave the page emitting a URL that 400s.
 *
 * - `.svg` exists only in procedural mode: the photo library is rasterized by
 *   sharp, and `/photo/id/5/300.svg` is a 400. Falling back to jpg keeps the
 *   toggle honest when the source switches back.
 * - Procedural mode has no random form — every pattern is a pure function of
 *   its seed — so an empty seed field gets one generated for it.
 */
function normalize(s: Settings, prev?: Settings): Settings {
  const next = { ...s };

  // Mode switch: sitting on the outgoing mode's implicit format means the user
  // never picked it, so adopt the incoming mode's default — svg for
  // procedural, jpg for the library. An explicit webp carries across. Needs
  // the previous settings, which is why `prev` exists; a restore has none.
  if (
    prev &&
    prev.mode !== next.mode &&
    next.format === implicitFormat(prev.mode)
  ) {
    next.format = implicitFormat(next.mode);
  }

  if (next.mode === "photo") {
    if (next.format === "svg") next.format = "jpeg";
  } else if (!next.seed.trim()) {
    next.seed = randomSeed();
  }

  return next;
}

/** The extension the server assumes when the path omits one. */
const implicitFormat = (mode: PhotoMode): PhotoFormat =>
  mode === "gen" ? "svg" : "jpeg";

/**
 * Path-only so the preview `<img>` loads from whatever origin the page is
 * served from (localhost, a preview deploy) while the displayed URL uses the
 * branded domain.
 */
function buildPhotoPath(s: Settings): string {
  const segments = ["/photo"];
  const seed = s.seed.trim();

  // Procedural mode has no catalog and no random form, so its seed is both
  // the only selector and a required one — `normalize` guarantees it. The
  // photo library's seed is optional; without one the request is random.
  if (s.mode === "gen") segments.push("gen", encodeURIComponent(seed));
  else if (seed) segments.push("seed", encodeURIComponent(seed));

  // The mode's implicit format is the server's default, so only a non-default
  // format needs the extension spelled out. The string itself comes from the
  // parser's own map.
  const ext =
    s.format === implicitFormat(s.mode)
      ? ""
      : `.${extensionForFormat(s.format)}`;

  // A square collapses to the single-segment `/photo/{size}` form.
  if (s.width === s.height) segments.push(`${s.width}${ext}`);
  else segments.push(String(s.width), `${s.height}${ext}`);

  const query: string[] = [];

  // `style` is procedural-only, and gradient is the server's default.
  if (s.mode === "gen" && s.style !== DEFAULT_PATTERN_STYLE)
    query.push(`style=${s.style}`);
  if (s.grayscale) query.push("grayscale");
  if (s.blur > 0) query.push(`blur=${s.blur}`);

  return segments.join("/") + (query.length ? `?${query.join("&")}` : "");
}

function buildPageUrl(s: Settings): string {
  const params = new URLSearchParams({
    w: String(s.width),
    h: String(s.height),
    fmt: extensionForFormat(s.format),
  });

  if (s.mode !== DEFAULT.mode) params.set("mode", s.mode);
  if (s.seed.trim()) params.set("seed", s.seed.trim());
  // Mirrors the image URL: style only means something in procedural mode.
  if (s.mode === "gen" && s.style !== DEFAULT_PATTERN_STYLE)
    params.set("style", s.style);
  if (s.grayscale) params.set("gray", "1");
  if (s.blur > 0) params.set("blur", String(s.blur));

  return `${window.location.origin}${window.location.pathname}?${params}`;
}

function parseSettings(params: URLSearchParams): Settings {
  const num = (key: string, fallback: number): number => {
    const raw = params.get(key);
    const parsed = raw === null ? NaN : parseInt(raw, 10);

    return isNaN(parsed) ? fallback : parsed;
  };

  const fmt = params.get("fmt");
  const style = params.get("style");

  return normalize({
    mode: params.get("mode") === "gen" ? "gen" : "photo",
    width: clampSize(num("w", DEFAULT.width)),
    height: clampSize(num("h", DEFAULT.height)),
    seed: sanitizeSeed(params.get("seed") ?? DEFAULT.seed),
    grayscale: params.get("gray") === "1",
    blur: clampBlur(num("blur", DEFAULT.blur)),
    format: fmt === "webp" ? "webp" : fmt === "svg" ? "svg" : "jpeg",
    style: style !== null && isPatternStyle(style) ? style : DEFAULT.style,
  });
}

const MODES: { value: PhotoMode; label: string; hint: string }[] = [
  {
    value: "photo",
    label: "photo library",
    hint: "cropped and resized from the photo library",
  },
  {
    value: "gen",
    label: "procedural",
    hint: "an SVG generated from the seed — no photo",
  },
];

const STYLES: Record<PatternStyle, { label: string; hint: string }> = {
  gradient: {
    label: "gradient",
    hint: "soft seeded gradient with blurred blobs",
  },
  label: {
    label: "dimensions",
    hint: "flat box with the pixel size printed on it",
  },
  bauhaus: { label: "bauhaus", hint: "seeded circles, arcs, and bars" },
  noise: { label: "noise", hint: "seeded fractal-noise field" },
};

/** svg is procedural-only; jpg stays first in the photo library's list. */
const FORMATS: Record<PhotoMode, PhotoFormat[]> = {
  photo: ["jpeg", "webp"],
  gen: ["svg", "jpeg", "webp"],
};

export default function PhotoPage(): React.ReactNode {
  const branding = useBranding();
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [pageUrl, setPageUrl] = useState("");
  // Load state is tracked by src rather than by a boolean flipped in an
  // effect: a src change is instantly "loading" again with no extra render.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const photoPath = buildPhotoPath(settings);
  const photoUrl = `https://${branding.domain}${photoPath}`;
  const isGen = settings.mode === "gen";
  const status =
    failedSrc === photoPath
      ? "error"
      : loadedSrc === photoPath
        ? "ready"
        : "loading";

  useEffect(() => {
    const restored = parseSettings(new URLSearchParams(window.location.search));

    setSettings(restored); // eslint-disable-line react-hooks/set-state-in-effect
    const initialUrl = buildPageUrl(restored);

    replaceUrlNow(initialUrl);
    setPageUrl(initialUrl);
  }, [replaceUrlNow]);

  const update = (patch: Partial<Settings>, immediate = false): void => {
    const next = normalize({ ...settings, ...patch }, settings);

    setSettings(next);
    const newUrl = buildPageUrl(next);

    if (immediate) replaceUrlNow(newUrl);
    else replaceUrl(newUrl);
    setPageUrl(newUrl);
  };

  const handleReset = (): void => {
    setSettings(DEFAULT);
    const newUrl = buildPageUrl(DEFAULT);

    replaceUrlNow(newUrl);
    setPageUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Placeholder Photos"
        metaDescription="Placeholder images at any size, addressed by URL. Crop the photo library or generate a seeded SVG pattern, set width, height, grayscale, and blur, then drop the URL straight into an img tag — no account or API key."
        path="/photo"
        h1="Placeholder Photos"
        tagline="Placeholder images at any size — photos or generated patterns, seeded and hotlinkable"
      >
        <div className={styles.body}>
          <div className={styles.controls}>
            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Source</span>
              <div className={styles.toggleGroup}>
                {MODES.map((m) => (
                  <Button
                    key={m.value}
                    variant="toggle"
                    active={settings.mode === m.value}
                    onClick={() => {
                      update({ mode: m.value }, true);
                    }}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
              <span className={styles.hint}>
                {MODES.find((m) => m.value === settings.mode)?.hint}
              </span>
            </div>

            {isGen && (
              <div className={styles.controlRow}>
                <span className={styles.controlLabel}>Style</span>
                <div className={styles.toggleGroup}>
                  {PATTERN_STYLES.map((s) => (
                    <Button
                      key={s}
                      variant="toggle"
                      active={settings.style === s}
                      onClick={() => {
                        update({ style: s }, true);
                      }}
                    >
                      {STYLES[s].label}
                    </Button>
                  ))}
                </div>
                <span className={styles.hint}>
                  {STYLES[settings.style].hint}
                </span>
              </div>
            )}

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Size</span>
              <input
                className={styles.numberInput}
                type="number"
                min={MIN_SIZE}
                max={MAX_SIZE}
                value={settings.width}
                aria-label="Width in pixels"
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);

                  if (!isNaN(v)) update({ width: clampSize(v) });
                }}
              />
              <span className={styles.times}>×</span>
              <input
                className={styles.numberInput}
                type="number"
                min={MIN_SIZE}
                max={MAX_SIZE}
                value={settings.height}
                aria-label="Height in pixels"
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);

                  if (!isNaN(v)) update({ height: clampSize(v) });
                }}
              />
              <span className={styles.hint}>
                {MIN_SIZE}–{MAX_SIZE} px
              </span>
            </div>

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Seed</span>
              <input
                className={styles.textInput}
                type="text"
                value={settings.seed}
                placeholder={isGen ? "required" : "empty = random each request"}
                autoComplete="off"
                spellCheck={false}
                aria-label="Seed"
                onChange={(e) => {
                  // Length is capped in sanitizeSeed rather than by
                  // maxLength, which also counts UTF-16 units and so can
                  // split a pasted emoji.
                  const seed = sanitizeSeed(e.target.value);

                  // Procedural mode has no random form, so clearing the field
                  // is refused rather than silently swapped for a fresh seed
                  // mid-keystroke — select-all-and-retype still works.
                  if (isGen && !seed.trim()) return;

                  update({ seed });
                }}
              />
              <Button
                variant="copy"
                size="sm"
                onClick={() => {
                  update({ seed: randomSeed() }, true);
                }}
              >
                Shuffle
              </Button>
            </div>

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Format</span>
              <div className={styles.toggleGroup}>
                {FORMATS[settings.mode].map((f) => (
                  <Button
                    key={f}
                    variant="toggle"
                    active={settings.format === f}
                    onClick={() => {
                      update({ format: f }, true);
                    }}
                  >
                    {extensionForFormat(f)}
                  </Button>
                ))}
              </div>
              <label className={styles.checkboxLabel}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  checked={settings.grayscale}
                  onChange={(e) => {
                    update({ grayscale: e.target.checked }, true);
                  }}
                />
                grayscale
              </label>
            </div>

            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Blur</span>
              <input
                className={styles.numberInput}
                type="number"
                min={0}
                max={MAX_BLUR}
                value={settings.blur}
                aria-label="Blur amount"
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);

                  if (!isNaN(v)) update({ blur: clampBlur(v) });
                }}
              />
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={MAX_BLUR}
                value={settings.blur}
                aria-label="Blur amount slider"
                onChange={(e) => {
                  update({ blur: clampBlur(parseInt(e.target.value, 10)) });
                }}
              />
              <span className={styles.hint}>
                {isGen ? "0 = off · SVG filter" : "0 = off"}
              </span>
            </div>

            <div className={styles.urlPanel}>
              <PanelHeader label="Image URL">
                <CopyButton value={photoUrl} variant="ghost" size="xs" />
              </PanelHeader>
              <code className={styles.url}>{photoUrl}</code>
            </div>
          </div>

          <div className={styles.previewPanel}>
            <PanelHeader label="Preview">
              <span className={styles.previewMeta}>
                {settings.width} × {settings.height}
              </span>
            </PanelHeader>
            <div className={styles.previewStage}>
              {status !== "ready" && (
                <span className={styles.previewStatus}>
                  {status === "error" ? "failed to load" : "loading…"}
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={photoPath}
                className={styles.previewImg}
                src={photoPath}
                alt={
                  isGen
                    ? `Generated ${STYLES[settings.style].label} pattern, ${settings.width} by ${settings.height}`
                    : `Placeholder photo, ${settings.width} by ${settings.height}`
                }
                data-loaded={status === "ready"}
                onLoad={() => {
                  setLoadedSrc(photoPath);
                }}
                onError={() => {
                  setFailedSrc(photoPath);
                }}
              />
            </div>
          </div>
        </div>
      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={pageUrl} onReset={handleReset} />
    </div>
  );
}
