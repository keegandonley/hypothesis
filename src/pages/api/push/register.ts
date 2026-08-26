import type { NextApiRequest, NextApiResponse } from "next";
import { upsertPushToken } from "@/lib/push-tokens";
import { track } from "@vercel/analytics/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reverse-domain bundle id (the APNs topic), e.g. codes.keegan.hypothesisproxy.
const BUNDLE_ID_RE = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });

    return;
  }

  const { deviceId, deviceSecret, token, platform, sandbox, bundleId } = (req.body ??
    {}) as {
    deviceId?: string;
    deviceSecret?: string;
    token?: string;
    platform?: string;
    sandbox?: boolean;
    bundleId?: string;
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

  // Optional per-device APNs topic; absent means the send falls back to the
  // deployment-wide APNS_BUNDLE_ID (legacy single-app behavior).
  if (
    bundleId !== undefined &&
    (typeof bundleId !== "string" || !BUNDLE_ID_RE.test(bundleId) || bundleId.length > 155)
  ) {
    res.status(400).json({ error: "invalid bundleId" });

    return;
  }

  try {
    await upsertPushToken(
      deviceId,
      token.trim(),
      platform.trim(),
      // An FCM registration token has no environment: it is scoped to a
      // Firebase project + app id, not to a delivery environment, and debug and
      // release builds mint tokens that go to the same host with the same
      // credential. Store NULL for Android rather than a meaningful-looking
      // `false`. iOS behavior is unchanged.
      platform.trim().toLowerCase() === "android" ? null : (sandbox ?? false),
      deviceSecret,
      bundleId?.trim(),
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
