import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "@vercel/kv";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        // Prefer Vercel's trusted IP header (not client-appendable); fall back for local dev
        const ip =
          (req.headers["x-vercel-forwarded-for"] as string) ??
          (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
          (req.headers["x-real-ip"] as string) ??
          "0.0.0.0";

        const hourKey = `compress:rate:hour:${ip}`;
        const dayKey = `compress:rate:day:${ip}`;

        const [hourCount, dayCount] = await Promise.all([
          kv.incr(hourKey),
          kv.incr(dayKey),
        ]);

        if (hourCount === 1) await kv.expire(hourKey, 3600);
        if (dayCount === 1) await kv.expire(dayKey, 86400);

        if (hourCount > 10 || dayCount > 25) {
          throw new Error("Rate limit exceeded. Try again later.");
        }

        return {
          allowedContentTypes: [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          addRandomSuffix: true,
        };
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
}
