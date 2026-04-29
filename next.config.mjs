/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
