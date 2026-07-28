/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // sharp 0.35's package restructure breaks Vercel's file tracing: the
  // linux-x64 libvips shared library (libvips-cpp.so.8.18.x) is left out of
  // the function bundle, causing ERR_DLOPEN_FAILED at runtime. Force-include
  // the pnpm store dirs for sharp's native binary and its libvips runtime.
  outputFileTracingIncludes: {
    "/api/compress/process": [
      "./node_modules/.pnpm/@img+sharp-linux-x64@*/**",
      "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/**",
    ],
  },
  rewrites: async () => [
    { source: "/sitemap.xml", destination: "/api/sitemap" },
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
