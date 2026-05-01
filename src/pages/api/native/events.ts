import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";
import { getEvents } from "@/lib/events";

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

  try {
    const sessionResult = await pool.query(
      "SELECT id FROM sessions WHERE device_id = $1",
      [deviceId]
    );
    if (!sessionResult.rows[0]) {
      return res.status(404).json({ error: "no session found for this device" });
    }

    const sessionId = sessionResult.rows[0].id as string;
    const host = req.headers.host ?? "hypothesis.sh";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const webhookUrl = `${protocol}://${host}/api/webhook/${sessionId}`;

    const events = await getEvents({ sessionId, after: afterParam, limit });
    return res.json({ events, count: events.length, sessionId, webhookUrl });
  } catch (err) {
    console.error("native events error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
