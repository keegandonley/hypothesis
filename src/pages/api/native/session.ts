import type { NextApiRequest, NextApiResponse } from "next";
import { getPushTokenByDeviceId } from "@/lib/push-tokens";
import { getOrCreateNativeSession } from "@/lib/session";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { deviceId } = req.body as { deviceId?: string };

  if (!deviceId || !UUID_RE.test(deviceId)) {
    return res.status(400).json({ error: "deviceId must be a valid UUID" });
  }

  const device = await getPushTokenByDeviceId(deviceId);
  if (!device) {
    return res.status(404).json({ error: "device not registered" });
  }

  try {
    const session = await getOrCreateNativeSession(deviceId);
    const host = req.headers.host ?? "hypothesis.sh";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const webhookUrl = `${protocol}://${host}/api/webhook/${session.id}`;
    return res.json({ sessionId: session.id, webhookUrl, createdAt: session.createdAt, updatedAt: session.updatedAt });
  } catch (err) {
    console.error("native session error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
