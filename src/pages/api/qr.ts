import type { NextApiRequest, NextApiResponse } from "next";
import QRCode from "qrcode";

type ECLevel = "L" | "M" | "Q" | "H";
const EC_LEVELS: ECLevel[] = ["L", "M", "Q", "H"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { value, ecl, dark, light } = req.query;

  if (!value || typeof value !== "string" || !value.trim()) {
    return res.status(400).json({ error: "Missing required query parameter: value" });
  }

  const ecLevel: ECLevel =
    typeof ecl === "string" && EC_LEVELS.includes(ecl as ECLevel)
      ? (ecl as ECLevel)
      : "M";

  const darkColor = typeof dark === "string" && /^#[0-9a-fA-F]{6}$/.test(dark) ? dark : "#000000";
  const lightColor = typeof light === "string" && /^#[0-9a-fA-F]{6}$/.test(light) ? light : "#ffffff";

  try {
    const svg = await QRCode.toString(value, {
      type: "svg",
      errorCorrectionLevel: ecLevel,
      margin: 2,
      color: { dark: darkColor, light: lightColor },
    });

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).send(svg);
  } catch {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
}
