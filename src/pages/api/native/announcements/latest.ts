import type { NextApiRequest, NextApiResponse } from "next";

import {
  getLatestActiveAnnouncement,
  parseAnnouncementPlatform,
} from "@/lib/announcements";
import { verifyDeviceSecret } from "@/lib/push-tokens";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).end();

    return;
  }

  const { deviceId, platform: platformParam } = req.query as {
    deviceId?: string;
    platform?: string;
  };

  if (!deviceId || !UUID_RE.test(deviceId)) {
    res.status(400).json({ error: "deviceId must be a valid UUID" });

    return;
  }

  const deviceSecret = req.headers["x-device-secret"];
  const authorized = await verifyDeviceSecret(
    deviceId,
    typeof deviceSecret === "string" ? deviceSecret : undefined,
  );

  if (!authorized) {
    res.status(403).json({ error: "forbidden" });

    return;
  }

  // Optional. Clients that omit it (every version shipped so far) get the
  // pre-Android behavior: newest announcement, bare minVersion, no targeting.
  const platform = parseAnnouncementPlatform(platformParam);

  try {
    const announcement = getLatestActiveAnnouncement(platform);

    if (!announcement) {
      res.status(204).end();

      return;
    }

    res.setHeader("Cache-Control", "private, max-age=60");

    res.json(announcement);

    return;
  } catch (err) {
    console.error("native announcements error", err);

    res.status(500).json({ error: "internal server error" });

    return;
  }
}
