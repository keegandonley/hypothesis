import type { NextApiRequest, NextApiResponse } from "next";
import { tools, type ToolItem } from "@/lib/tools";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ToolItem[]>
) {
  if (req.method !== "GET") return res.status(405).end();

  const raw = req.query.includeMobile;
  const includeMobile = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const result = [...tools]
    .filter((t) => !t.mobileOnly || includeMobile.includes(t.href.replace(/^\//, "")))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.json(result);
}
