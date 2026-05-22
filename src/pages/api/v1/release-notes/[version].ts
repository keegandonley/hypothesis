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

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("---", 3);

  if (end === -1) return { meta: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const meta: Record<string, string> = {};

  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");

    if (colon > -1)
      meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }

  return { meta, body: raw.slice(end + 3).trim() };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  if (req.method !== "GET") {
    res.status(405).end();

    return;
  }

  const { version } = req.query;

  if (typeof version !== "string") {
    res.status(400).json({ error: "Invalid version" });

    return;
  }

  const filePath = path.join(RELEASES_DIR, `${version}.md`);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Release not found" });

    return;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { meta, body } = parseFrontmatter(raw);

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.json({
    slug: version,
    date: version,
    title: meta.title ?? version,
    description: meta.description ?? "",
    tags: parseTags(meta.tags),
    content: body,
  });
}
