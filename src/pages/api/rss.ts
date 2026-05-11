import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const RELEASES_DIR = path.join(process.cwd(), "src/content/releases");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("---", 3);
  if (end === -1) return { meta: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const meta: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");
    if (colon > -1) meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return { meta, body: raw.slice(end + 3).trim() };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const host = req.headers.host ?? "hypothesis.sh";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const baseUrl = `${protocol}://${host}`;

  const releases = fs
    .readdirSync(RELEASES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(RELEASES_DIR, file), "utf-8");
      const { meta, body } = parseFrontmatter(raw);
      return { slug, meta, body };
    })
    .sort((a, b) => b.slug.localeCompare(a.slug));

  const items = releases
    .map(({ slug, meta, body }) => {
      const title = escapeXml(meta.title ?? slug);
      const description = escapeXml(meta.description ?? body.slice(0, 200).replace(/\n/g, " ").trim());
      const link = `${baseUrl}/release-notes/${slug}`;
      const pubDate = new Date(slug).toUTCString();
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const lastBuildDate = releases.length > 0 ? new Date(releases[0].slug).toUTCString() : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Hypothesis Release Notes</title>
    <link>${baseUrl}/release-notes</link>
    <description>Updates and improvements to Hypothesis</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.send(xml);
}
