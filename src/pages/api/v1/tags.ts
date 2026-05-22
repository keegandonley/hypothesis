import type { NextApiRequest, NextApiResponse } from "next";
import { TAG_COLORS } from "@/lib/tools";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<typeof TAG_COLORS>,
): void {
  if (req.method !== "GET") {
    res.status(405).end();

    return;
  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.json(TAG_COLORS);
}
