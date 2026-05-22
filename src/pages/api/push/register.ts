import type { NextApiRequest, NextApiResponse } from "next";
import { upsertPushToken } from "@/lib/push-tokens";
import { track } from "@vercel/analytics/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });

    return;
  }

  const { deviceId, deviceSecret, token, platform, sandbox } = (req.body ??
    {}) as {
    deviceId?: string;
    deviceSecret?: string;
    token?: string;
    platform?: string;
    sandbox?: boolean;
  };

  if (!deviceId || !UUID_RE.test(deviceId)) {
    res.status(400).json({ error: "invalid or missing deviceId" });

    return;
  }

  if (!token || typeof token !== "string" || token.trim() === "") {
    res.status(400).json({ error: "missing token" });

    return;
  }

  if (!platform || typeof platform !== "string" || platform.trim() === "") {
    res.status(400).json({ error: "missing platform" });

    return;
  }

  try {
    await upsertPushToken(
      deviceId,
      token.trim(),
      platform.trim(),
      sandbox ?? false,
      deviceSecret,
    );

    try {
      await track("Device Registered", { platform: platform.trim() });
    } catch (err) {
      console.warn("[analytics] failed to track Device Registered", err);
    }

    res.status(200).json({ ok: true });

    return;
  } catch (err) {
    if (err instanceof Error && err.message === "secret_mismatch") {
      res.status(403).json({ error: "forbidden" });

      return;
    }

    console.error("push register error", err);

    res.status(500).json({ error: "internal server error" });

    return;
  }
}
