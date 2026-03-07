/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/iframe-proxy',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: 'frame-src *;',
        },
      ],
    },
  ],
};

export default nextConfig;
