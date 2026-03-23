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
  ],
};

export default nextConfig;
