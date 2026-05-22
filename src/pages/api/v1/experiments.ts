import type { NextApiRequest, NextApiResponse } from "next";
import { experiments, type ExperimentItem } from "@/lib/tools";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExperimentItem[]>,
) {
  if (req.method !== "GET") return res.status(405).end();
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.json(experiments);
}
