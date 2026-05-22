import type { NextApiRequest, NextApiResponse } from "next";
import { getPushTokenByDeviceId } from "@/lib/push-tokens";
import { sendApnsNotification, type ApnsOptions } from "@/lib/apns";
import { insertPushNotification } from "@/lib/push-notifications";
import { track } from "@vercel/analytics/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const queryDeviceId =
    typeof req.query.deviceId === "string" ? req.query.deviceId : undefined;
  const queryTitle =
    typeof req.query.title === "string" ? req.query.title : undefined;
  const queryBody =
    typeof req.query.body === "string" ? req.query.body : undefined;
  const querySubtitle =
    typeof req.query.subtitle === "string" ? req.query.subtitle : undefined;
  const querySound =
    typeof req.query.sound === "string" ? req.query.sound : undefined;
  const queryBadgeRaw =
    typeof req.query.badge === "string" ? req.query.badge : undefined;
  const queryDataRaw =
    typeof req.query.data === "string" ? req.query.data : undefined;
  const querySandbox =
    typeof req.query.sandbox === "string"
      ? req.query.sandbox === "true"
      : undefined;

  let queryData: object | undefined;
  if (queryDataRaw) {
    try {
      queryData = JSON.parse(queryDataRaw);
    } catch {
      return res
        .status(400)
        .json({ error: "invalid data query param: must be valid JSON" });
    }
  }

  let queryBadge: number | undefined;
  if (queryBadgeRaw !== undefined) {
    queryBadge = parseInt(queryBadgeRaw, 10);
    if (isNaN(queryBadge) || queryBadge < 0) {
      return res
        .status(400)
        .json({ error: "badge must be a non-negative integer" });
    }
  }

  const bodyParams = (req.body ?? {}) as {
    deviceId?: string;
    title?: string;
    body?: string;
    subtitle?: string;
    sound?: string | null;
    badge?: number;
    data?: object;
    sandbox?: boolean;
  };

  const deviceId = bodyParams.deviceId ?? queryDeviceId;
  const title = bodyParams.title ?? queryTitle;
  const body = bodyParams.body ?? queryBody;
  const data = bodyParams.data ?? queryData;
  const sandbox =
    bodyParams.sandbox ??
    querySandbox ??
    process.env.APNS_PRODUCTION !== "true";

  const options: ApnsOptions = {};
  const subtitle = bodyParams.subtitle ?? querySubtitle;
  if (subtitle) options.subtitle = subtitle;
  const sound = bodyParams.sound !== undefined ? bodyParams.sound : querySound;
  if (sound !== undefined) options.sound = sound;
  const badge = bodyParams.badge ?? queryBadge;
  if (badge !== undefined) options.badge = badge;

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
    if (!record.token) {
      return res.status(422).json({ error: "device has no push token" });
    }

    const result = await sendApnsNotification(
      record.token,
      title.trim(),
      body.trim(),
      data,
      options,
      sandbox,
    );

    await insertPushNotification({
      deviceId: deviceId!,
      title: title.trim(),
      body: body.trim(),
      subtitle: options.subtitle ?? null,
      data: data ?? null,
      apnsId: result.apnsId ?? null,
      success: result.ok,
    }).catch((err) =>
      console.error("[push/send] failed to record notification", err),
    );

    try {
      await track("Push Notification Sent", {
        platform: record.platform,
        success: result.ok,
      });
    } catch (err) {
      console.warn("[analytics] failed to track Push Notification Sent", err);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("push send error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
