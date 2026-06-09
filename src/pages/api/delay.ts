import type { NextApiRequest, NextApiResponse } from "next";

// Hold a function open so the platform allows the full sleep window.
export const config = { maxDuration: 60 };

const MAX_DELAY_MS = 60000;

// 1×1 transparent GIF — the response the document's `load` event waits on.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
  "base64",
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).end();

    return;
  }

  const { ms } = req.query;
  const parsed = typeof ms === "string" ? parseInt(ms, 10) : NaN;
  const delay = Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 0), MAX_DELAY_MS)
    : 0;

  await new Promise((resolve) => setTimeout(resolve, delay));

  res.setHeader("Content-Type", "image/gif");
  // Never cache — a cached response would collapse the delay on repeat loads.
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(PIXEL);
}
