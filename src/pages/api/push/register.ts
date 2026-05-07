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

  const { deviceId, deviceSecret, token, platform, sandbox } = (req.body ?? {}) as {
    deviceId?: string;
    deviceSecret?: string;
    token?: string;
    platform?: string;
    sandbox?: boolean;
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
    await upsertPushToken(
      deviceId,
      token.trim(),
      platform.trim(),
      sandbox ?? false,
      deviceSecret,
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "secret_mismatch") {
      return res.status(403).json({ error: "forbidden" });
    }

    console.error("push register error", err);

    return res.status(500).json({ error: "internal server error" });
  }
}
