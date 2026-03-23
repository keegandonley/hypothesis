import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ??
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  disable: process.env.NODE_ENV !== "production",
  swSrc: "src/service-worker/index.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

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

export default withSerwist(nextConfig);
