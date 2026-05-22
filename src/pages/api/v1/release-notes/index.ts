import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const RELEASES_DIR = path.join(process.cwd(), "src/content/releases");

function parseTags(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseFrontmatter(raw: string): Record<string, string> {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("---", 3);
  if (end === -1) return {};
  const block = raw.slice(3, end).trim();
  const meta: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");
    if (colon > -1)
      meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return meta;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const files = fs.readdirSync(RELEASES_DIR).filter((f) => f.endsWith(".md"));
  const releases = files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(RELEASES_DIR, file), "utf-8");
      const meta = parseFrontmatter(raw);
      return {
        slug,
        date: slug,
        title: meta.title ?? slug,
        description: meta.description ?? "",
        tags: parseTags(meta.tags),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.json(releases);
}
