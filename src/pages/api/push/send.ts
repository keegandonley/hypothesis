import type { NextApiRequest, NextApiResponse } from "next";
import { getPushTokenByDeviceId } from "@/lib/push-tokens";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: unknown;
};

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

    const message = {
      to: record.token,
      title: title.trim(),
      body: body.trim(),
      ...(data ? { data } : {}),
    };

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify([message]),
    });

    const expoData = await expoRes.json();
    const ticket: ExpoTicket = expoData?.data?.[0] ?? { status: "error", message: "no response" };

    return res.status(200).json({ ticket });
  } catch (err) {
    console.error("push send error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
