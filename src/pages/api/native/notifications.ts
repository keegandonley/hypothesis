import type { NextApiRequest, NextApiResponse } from "next";
import { getPushNotifications } from "@/lib/push-notifications";
import { verifyDeviceSecret } from "@/lib/push-tokens";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { deviceId, after: afterParam, limit: limitParam } = req.query as {
    deviceId?: string;
    after?: string;
    limit?: string;
  };

  if (!deviceId || !UUID_RE.test(deviceId)) {
    return res.status(400).json({ error: "deviceId must be a valid UUID" });
  }

  if (afterParam) {
    const ts = Date.parse(afterParam);
    if (isNaN(ts)) {
      return res.status(400).json({ error: "invalid 'after' parameter — expected ISO 8601 date" });
    }
  }

  const limit = Math.min(parseInt(limitParam ?? "50", 10) || 50, 200);
  const deviceSecret = req.headers["x-device-secret"];
  const authorized = await verifyDeviceSecret(
    deviceId,
    typeof deviceSecret === "string" ? deviceSecret : undefined,
  );

  if (!authorized) {
    return res.status(403).json({ error: "forbidden" });
  }

  try {
    const notifications = await getPushNotifications({ deviceId, after: afterParam, limit });
    return res.json({ notifications, count: notifications.length });
  } catch (err) {
    console.error("native notifications error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
