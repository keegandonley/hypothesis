import type { NextApiRequest, NextApiResponse } from "next";
import { del } from "@vercel/blob";
import sharp from "sharp";

export type OutputFormat = "png" | "webp" | "avif";

export const config = {
  api: {
    responseLimit: "50mb",
  },
};

const CONTENT_TYPES: Record<OutputFormat, string> = {
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url, format, filename } = req.body as {
    url: string;
    format: OutputFormat;
    filename: string;
  };

  if (!url || !format || !filename) {
    return res.status(400).json({ error: "Missing url, format, or filename" });
  }

  if (!["png", "webp", "avif"].includes(format)) {
    return res.status(400).json({ error: "Invalid format" });
  }

  const BLOB_URL_RE =
    /^https:\/\/[a-z0-9-]+\.private\.blob\.vercel-storage\.com\//;
  if (!BLOB_URL_RE.test(url)) {
    return res.status(400).json({ error: "Invalid source URL" });
  }

  let inputBuffer: Buffer;

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    console.log(response);

    if (!response.ok) {
      return res.status(400).json({ error: "Failed to fetch blob" });
    }
    inputBuffer = Buffer.from(await response.arrayBuffer());
  } catch {
    return res.status(400).json({ error: "Failed to fetch source file" });
  }

  let outputBuffer: Buffer;
  try {
    const pipeline = sharp(inputBuffer);

    if (format === "png") {
      outputBuffer = await pipeline
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
        .toBuffer();
    } else if (format === "webp") {
      outputBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
    } else {
      outputBuffer = await pipeline.avif({ quality: 50 }).toBuffer();
    }
  } catch {
    return res.status(500).json({ error: "Compression failed" });
  }

  // Clean up source blob (best-effort, don't block response)
  del(url).catch(() => {});

  const ext = format === "png" ? ".png" : format === "webp" ? ".webp" : ".avif";
  const baseName = filename.replace(/\.[^.]+$/, "");
  const outFilename = `compressed-${baseName}${ext}`;

  res.setHeader("Content-Type", CONTENT_TYPES[format]);
  res.setHeader("Content-Disposition", `attachment; filename="${outFilename}"`);
  res.setHeader("X-Original-Size", String(inputBuffer.length));
  res.setHeader("X-Compressed-Size", String(outputBuffer.length));
  res.setHeader("Content-Length", String(outputBuffer.length));

  return res.status(200).send(outputBuffer);
}
