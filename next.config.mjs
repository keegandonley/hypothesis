/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => [
    { source: "/sitemap.xml", destination: "/api/sitemap" },
    { source: "/photo/:path+", destination: "/api/photo/:path+" },
    { source: "/datasets/:path*", destination: "/api/datasets/:path*" },
  ],
  images: {
    remotePatterns: [{ hostname: "static.donley.xyz" }],
  },
  headers: async () => [
    {
      source: "/iframe-proxy",
      headers: [
        {
          key: "Content-Security-Policy",
          value: "frame-src *;",
        },
      ],
    },
    {
      // Static .fit downloads in public/; the JSON API for the same dataset is
      // served by the /datasets rewrite, which static files take precedence over.
      source: "/datasets/fit_activities/:file([a-z0-9-]+\\.fit)",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Content-Type", value: "application/octet-stream" },
        { key: "Content-Disposition", value: "attachment" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        {
          key: "Link",
          value:
            '<https://creativecommons.org/licenses/by/4.0/>; rel="license"',
        },
        {
          key: "Cache-Control",
          value: "public, max-age=3600, s-maxage=86400",
        },
      ],
    },
    {
      source: "/api/v1/:path*",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
        { key: "Access-Control-Allow-Headers", value: "Content-Type" },
      ],
    },
  ],
};

export default nextConfig;
