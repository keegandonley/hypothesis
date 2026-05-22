import type { NextApiRequest, NextApiResponse } from "next";
import { getPushNotifications } from "@/lib/push-notifications";
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

  const {
    deviceId,
    after: afterParam,
    limit: limitParam,
  } = req.query as {
    deviceId?: string;
    after?: string;
    limit?: string;
  };

  if (!deviceId || !UUID_RE.test(deviceId)) {
    res.status(400).json({ error: "deviceId must be a valid UUID" });

    return;
  }

  if (afterParam) {
    const ts = Date.parse(afterParam);

    if (isNaN(ts)) {
      res
        .status(400)
        .json({ error: "invalid 'after' parameter — expected ISO 8601 date" });

      return;
    }
  }

  const limit = Math.min(parseInt(limitParam ?? "50", 10) || 50, 200);
  const deviceSecret = req.headers["x-device-secret"];
  const authorized = await verifyDeviceSecret(
    deviceId,
    typeof deviceSecret === "string" ? deviceSecret : undefined,
  );

  if (!authorized) {
    res.status(403).json({ error: "forbidden" });

    return;
  }

  try {
    const notifications = await getPushNotifications({
      deviceId,
      after: afterParam,
      limit,
    });

    res.json({ notifications, count: notifications.length });

    return;
  } catch (err) {
    console.error("native notifications error", err);

    res.status(500).json({ error: "internal server error" });

    return;
  }
}
