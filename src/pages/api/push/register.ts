import type { NextApiRequest, NextApiResponse } from "next";
import { upsertPushToken } from "@/lib/push-tokens";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { deviceId, token, platform } = (req.body ?? {}) as {
    deviceId?: string;
    token?: string;
    platform?: string;
  };

  if (!deviceId || !UUID_RE.test(deviceId)) {
    return res.status(400).json({ error: "invalid or missing deviceId" });
  }
  if (!token || typeof token !== "string" || token.trim() === "") {
    return res.status(400).json({ error: "missing token" });
  }
  if (!platform || typeof platform !== "string" || platform.trim() === "") {
    return res.status(400).json({ error: "missing platform" });
  }

  try {
    await upsertPushToken(deviceId, token.trim(), platform.trim());
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("push register error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
