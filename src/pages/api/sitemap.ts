import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { tools, references, experiments } from "@/lib/tools";

const DOCS_DIR = path.join(process.cwd(), "src/content/docs");
const RELEASES_DIR = path.join(process.cwd(), "src/content/releases");

const nonToolRoutes = ["/", "/work", "/scratch", "/release-notes"];

function getStaticRoutes(): string[] {
  return [
    ...nonToolRoutes,
    ...tools.map((t) => t.href),
    ...references.map((r) => r.href),
    ...experiments.map((e) => e.href.split("?")[0]),
  ];
}

function generateSitemap(
  baseUrl: string,
  docSlugs: string[],
  releaseSlugs: string[],
): string {
  const urls = [
    ...getStaticRoutes().map((route) => `${baseUrl}${route}`),
    ...docSlugs.map((slug) => `${baseUrl}/docs/${slug}`),
    ...releaseSlugs.map((slug) => `${baseUrl}/release-notes/${slug}`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const host = req.headers.host ?? "hypothesis.sh";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const baseUrl = `${protocol}://${host}`;

  const docSlugs = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  const releaseSlugs = fs
    .readdirSync(RELEASES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  const sitemap = generateSitemap(baseUrl, docSlugs, releaseSlugs);

  res.setHeader("Content-Type", "application/xml");
  res.send(sitemap);
}
