import fs from "fs";
import path from "path";

import yaml from "js-yaml";

export type PopupHighlightKind = "tool" | "experiment" | "reference";

export interface PopupHighlight {
  kind: PopupHighlightKind;
  href: string;
}

export interface Announcement {
  id: string;
  title: string;
  imageUrl: string | null;
  markdown: string;
  minVersion: string | null;
  devMode: boolean;
  highlights: PopupHighlight[];
  publishedAt: string;
}

const ANNOUNCEMENTS_DIR = path.join(process.cwd(), "src/content/announcements");

interface RawFrontmatter {
  id?: string;
  title?: string;
  imageUrl?: string;
  minVersion?: string;
  devMode?: boolean;
  active?: boolean;
  publishedAt?: string;
  highlights?: PopupHighlight[];
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

function loadAll(): Announcement[] {
  if (!fs.existsSync(ANNOUNCEMENTS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(ANNOUNCEMENTS_DIR)
    .filter((f) => f.endsWith(".md"));

  return files
    .map((file): Announcement | null => {
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
        devMode: meta.devMode === true,
        highlights: Array.isArray(meta.highlights) ? meta.highlights : [],
        publishedAt,
      };
    })
    .filter((a): a is Announcement => a !== null);
}

export function getLatestActiveAnnouncement(): Announcement | null {
  const all = loadAll().sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return all[0] ?? null;
}
