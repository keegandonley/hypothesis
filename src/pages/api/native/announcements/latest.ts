import type { NextApiRequest, NextApiResponse } from "next";

import { getLatestActiveAnnouncement } from "@/lib/announcements";
import { verifyDeviceSecret } from "@/lib/push-tokens";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { deviceId } = req.query as { deviceId?: string };

  if (!deviceId || !UUID_RE.test(deviceId)) {
    return res.status(400).json({ error: "deviceId must be a valid UUID" });
  }

  const deviceSecret = req.headers["x-device-secret"];
  const authorized = await verifyDeviceSecret(
    deviceId,
    typeof deviceSecret === "string" ? deviceSecret : undefined,
  );

  if (!authorized) {
    return res.status(403).json({ error: "forbidden" });
  }

  try {
    const announcement = getLatestActiveAnnouncement();

    if (!announcement) {
      return res.status(204).end();
    }

    res.setHeader("Cache-Control", "private, max-age=60");

    return res.json(announcement);
  } catch (err) {
    console.error("native announcements error", err);

    return res.status(500).json({ error: "internal server error" });
  }
}
