import type { NextApiRequest, NextApiResponse } from "next";

// Echoes the posted JSON body back verbatim at the top level.
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method not allowed" });

    return;
  }

  const body: unknown = req.body;

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    res.status(400).json({ error: "expected a JSON object body" });

    return;
  }

  res.status(200).json(body);
}
