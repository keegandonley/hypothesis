import type { NextApiRequest, NextApiResponse } from "next";
import { getPushTokenByDeviceId } from "@/lib/push-tokens";
import { sendApnsNotification } from "@/lib/apns";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
  const queryDataRaw =
    typeof req.query.data === "string" ? req.query.data : undefined;

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

  const bodyParams = (req.body ?? {}) as {
    deviceId?: string;
    title?: string;
    body?: string;
    data?: object;
  };

  const deviceId = bodyParams.deviceId ?? queryDeviceId;
  const title = bodyParams.title ?? queryTitle;
  const body = bodyParams.body ?? queryBody;
  const data = bodyParams.data ?? queryData;

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
