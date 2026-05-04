import type { NextApiRequest, NextApiResponse } from "next";
import { getPushTokenByDeviceId } from "@/lib/push-tokens";
import { sendApnsNotification } from "@/lib/apns";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { deviceId, title, body, data } = (req.body ?? {}) as {
    deviceId?: string;
    title?: string;
    body?: string;
    data?: object;
  };

  if (!deviceId || !UUID_RE.test(deviceId)) {
    return res.status(400).json({ error: "invalid or missing deviceId" });
  }
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "missing title" });
  }
  if (!body || typeof body !== "string" || body.trim() === "") {
    return res.status(400).json({ error: "missing body" });
  }

  try {
    const record = await getPushTokenByDeviceId(deviceId);
    if (!record) {
      return res.status(404).json({ error: "device not found" });
    }

    const result = await sendApnsNotification(
      record.token,
      title.trim(),
      body.trim(),
      data,
    );

    return res.status(200).json(result);
  } catch (err) {
    console.error("push send error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
