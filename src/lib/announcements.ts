import fs from "fs";
import path from "path";

import yaml from "js-yaml";

export type PopupHighlightKind = "tool" | "experiment" | "reference";

export type AnnouncementPlatform = "ios" | "android";

const PLATFORMS: readonly AnnouncementPlatform[] = ["ios", "android"];

export interface PopupHighlight {
  kind: PopupHighlightKind;
  href: string;
}

export interface Announcement {
  id: string;
  title: string;
  imageUrl: string | null;
  // Resolved for the requesting platform: the per-platform `minVersions` entry
  // when one exists, otherwise the bare `minVersion`. Callers that do not
  // identify a platform always get the bare `minVersion`.
  minVersion: string | null;
  // Platforms this announcement targets. null means "every platform", which is
  // how every announcement written before platform targeting existed behaves.
  platforms: AnnouncementPlatform[] | null;
  markdown: string;
  devMode: boolean;
  highlights: PopupHighlight[];
  publishedAt: string;
}

export function parseAnnouncementPlatform(
  value: unknown,
): AnnouncementPlatform | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return PLATFORMS.find((platform) => platform === normalized) ?? null;
}

const ANNOUNCEMENTS_DIR = path.join(process.cwd(), "src/content/announcements");

interface RawFrontmatter {
  id?: string;
  title?: string;
  imageUrl?: string;
  minVersion?: string;
  // Optional platform targeting. Omit both keys to keep the pre-Android
  // behavior: the announcement shows everywhere and `minVersion` gates every
  // platform with a single string.
  platforms?: unknown;
  minVersions?: unknown;
  devMode?: boolean;
  active?: boolean;
  publishedAt?: string;
  highlights?: PopupHighlight[];
}

function parsePlatforms(value: unknown): AnnouncementPlatform[] | null {
  const raw = Array.isArray(value) ? value : [value];
  const parsed = raw
    .map(parseAnnouncementPlatform)
    .filter((p): p is AnnouncementPlatform => p !== null);

  return parsed.length > 0 ? parsed : null;
}

function parseMinVersions(
  value: unknown,
): Partial<Record<AnnouncementPlatform, string>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const result: Partial<Record<AnnouncementPlatform, string>> = {};

  for (const [key, version] of entries) {
    const platform = parseAnnouncementPlatform(key);

    if (platform && typeof version === "string" && version.trim() !== "") {
      result[platform] = version.trim();
    }
  }

  return result;
}

function splitFrontmatter(raw: string): { meta: RawFrontmatter; body: string } {
  if (!raw.startsWith("---")) {
    return { meta: {}, body: raw };
  }

  const end = raw.indexOf("\n---", 3);

  if (end === -1) {
    return { meta: {}, body: raw };
  }

  const yamlBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const meta = (yaml.load(yamlBlock) ?? {}) as RawFrontmatter;

  return { meta, body };
}

// `minVersions` stays internal: the wire shape keeps a single resolved
// `minVersion` so a client never has to pick between two gating fields.
interface LoadedAnnouncement extends Announcement {
  minVersions: Partial<Record<AnnouncementPlatform, string>>;
}

function loadAll(): LoadedAnnouncement[] {
  if (!fs.existsSync(ANNOUNCEMENTS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(ANNOUNCEMENTS_DIR)
    .filter((f) => f.endsWith(".md"));

  return files
    .map((file): LoadedAnnouncement | null => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(ANNOUNCEMENTS_DIR, file), "utf-8");
      const { meta, body } = splitFrontmatter(raw);

      if (meta.active === false) {
        return null;
      }

      const publishedAtSource = meta.publishedAt ?? slug;
      const parsed = new Date(publishedAtSource);
      const publishedAt = isNaN(parsed.getTime())
        ? new Date(0).toISOString()
        : parsed.toISOString();

      return {
        id: meta.id ?? slug,
        title: meta.title ?? slug,
        imageUrl: meta.imageUrl ?? null,
        markdown: body.trim(),
        minVersion: meta.minVersion ?? null,
        platforms: parsePlatforms(meta.platforms),
        minVersions: parseMinVersions(meta.minVersions),
        devMode: meta.devMode === true,
        highlights: Array.isArray(meta.highlights) ? meta.highlights : [],
        publishedAt,
      };
    })
    .filter((a): a is LoadedAnnouncement => a !== null);
}

function toAnnouncement(
  loaded: LoadedAnnouncement,
  platform: AnnouncementPlatform | null,
): Announcement {
  const platformMinVersion = platform
    ? loaded.minVersions[platform]
    : undefined;

  return {
    id: loaded.id,
    title: loaded.title,
    imageUrl: loaded.imageUrl,
    markdown: loaded.markdown,
    minVersion: platformMinVersion ?? loaded.minVersion,
    platforms: loaded.platforms,
    devMode: loaded.devMode,
    highlights: loaded.highlights,
    publishedAt: loaded.publishedAt,
  };
}

// `platform` is optional. When the caller does not identify a platform this
// behaves exactly as it did before Android existed: the newest announcement,
// no targeting filter, and the bare `minVersion` string. When a platform is
// given, announcements that target other platforms are skipped and a
// per-platform `minVersions` entry wins over the bare `minVersion`.
export function getLatestActiveAnnouncement(
  platform?: AnnouncementPlatform | null,
): Announcement | null {
  const all = loadAll().sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  if (!platform) {
    const latest = all[0];

    return latest ? toAnnouncement(latest, null) : null;
  }

  const match = all.find(
    (a) => a.platforms === null || a.platforms.includes(platform),
  );

  return match ? toAnnouncement(match, platform) : null;
}
