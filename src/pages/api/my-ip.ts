import type { NextApiRequest, NextApiResponse } from "next";

export interface IpData {
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<IpData>) {
  const ip =
    (req.headers["x-vercel-forwarded-for"] as string) ??
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
    (req.headers["x-real-ip"] as string) ??
    "127.0.0.1";

  const city = req.headers["x-vercel-ip-city"]
    ? decodeURIComponent(req.headers["x-vercel-ip-city"] as string)
    : null;

  res.setHeader("Cache-Control", "no-store");
  res.json({
    ip,
    city,
    region: (req.headers["x-vercel-ip-country-region"] as string) ?? null,
    country: (req.headers["x-vercel-ip-country"] as string) ?? null,
    latitude: (req.headers["x-vercel-ip-latitude"] as string) ?? null,
    longitude: (req.headers["x-vercel-ip-longitude"] as string) ?? null,
    timezone: (req.headers["x-vercel-ip-timezone"] as string) ?? null,
  });
}
