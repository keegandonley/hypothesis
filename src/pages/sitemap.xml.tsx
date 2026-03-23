import { GetServerSideProps } from "next";
import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "src/content/docs");

const staticRoutes = [
  "/",
  "/base64",
  "/datetime",
  "/numbase",
  "/pretty-print",
  "/regex",
  "/urlencode",
  "/uuid",
  "/webhook",
  "/iframe-proxy",
  "/message-stream",
  "/message-factory",
  "/jwt",
  "/color",
  "/hash",
  "/chmod",
  "/cidr",
  "/cron",
  "/bitwise",
  "/lorem",
  "/qr",
  "/text-stats",
  "/css-unit",
  "/html-entity",
  "/unicode",
  "/diff",
  "/json-ts",
  "/compress",
  "/rsa",
  "/my-ip",
  "/references/http-status-codes",
  "/references/mime-types",
  "/references/unix-signals",
  "/references/http-headers",
  "/references/ascii",
  "/references/unicode-blocks",
];

function generateSitemap(baseUrl: string, docSlugs: string[]): string {
  const urls = [
    ...staticRoutes.map((route) => `${baseUrl}${route}`),
    ...docSlugs.map((slug) => `${baseUrl}/docs/${slug}`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const host = req.headers.host ?? "hypothesis.sh";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const baseUrl = `${protocol}://${host}`;

  const docSlugs = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));

  const sitemap = generateSitemap(baseUrl, docSlugs);

  res.setHeader("Content-Type", "application/xml");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function SitemapPage() {
  return null;
}
